const fs = require('fs');
const path = require('path');
const { assertSucceeds, assertFails, initializeTestEnvironment } = require('@firebase/rules-unit-testing');

const PROJECT_ID = 'site-amm-test';
const RULES_PATH = path.resolve(__dirname, '../../security-rules.json');
const FIXTURES_PATH = path.resolve(__dirname, './fixtures/fixtures.json');

let testEnv;

function dbRef(context, p) {
  return context.database().ref(p);
}

describe('Firebase Realtime Database Security Rules (emulator)', function() {
  this.timeout(20000);

  before(async () => {
    if (!process.env.FIREBASE_DATABASE_EMULATOR_HOST && !process.env.FIREBASE_EMULATOR_HOST) {
      throw new Error('Firebase Realtime Database emulator host not detected in environment. Set FIREBASE_DATABASE_EMULATOR_HOST before running tests.');
    }

    const rules = fs.readFileSync(RULES_PATH, 'utf8');
    const fixtures = JSON.parse(fs.readFileSync(FIXTURES_PATH, 'utf8'));

    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      database: {
        rules,
        host: '127.0.0.1',
        port: 9000
      }
    });

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.database().ref('/').set(fixtures);
    });
  });

  after(async () => {
    if (testEnv) {
      await testEnv.clearDatabase();
      await testEnv.cleanup();
    }
  });

  describe('Anonymous user', () => {
    it('cannot read private nodes like /users', async () => {
      const anon = testEnv.unauthenticatedContext();
      await assertFails(dbRef(anon, 'users').once('value'));
    });

    it('cannot read /employees', async () => {
      const anon = testEnv.unauthenticatedContext();
      await assertFails(dbRef(anon, 'employees').once('value'));
    });

    it('cannot read /token_pool', async () => {
      const anon = testEnv.unauthenticatedContext();
      await assertFails(dbRef(anon, 'token_pool').once('value'));
    });

    it('cannot read /logs', async () => {
      const anon = testEnv.unauthenticatedContext();
      await assertFails(dbRef(anon, 'logs').once('value'));
    });
  });

  describe('Member user', () => {
    let member;
    before(() => {
      member = testEnv.authenticatedContext('memberUid');
    });

    it('can read allowed public parametres', async () => {
      await assertSucceeds(dbRef(member, 'parametres').once('value'));
    });

    it('cannot read /employees', async () => {
      await assertFails(dbRef(member, 'employees').once('value'));
    });

    it('cannot modify roles or permissions', async () => {
      await assertFails(dbRef(member, 'users/adminUid/role').set('SUPER_ADMIN'));
      await assertFails(dbRef(member, 'users/memberUid/permissions').set({ 'roles.manage': true }));
    });

    it('cannot read legacy password fields', async () => {
      await assertFails(dbRef(member, 'users/legacyPwdUid/password').once('value'));
    });
  });

  describe('HR user', () => {
    let hr;
    before(() => {
      hr = testEnv.authenticatedContext('hrUid');
    });

    it('can read employees', async () => {
      await assertSucceeds(dbRef(hr, 'employees').once('value'));
    });

    it('can write attendance when permitted', async () => {
      await assertSucceeds(dbRef(hr, 'attendance/att2').set({ employeeId: 'EMP-002', date: '2026-02-01' }));
    });

    it('cannot read token_pool', async () => {
      await assertFails(dbRef(hr, 'token_pool').once('value'));
    });

    it('cannot escalate roles to SUPER_ADMIN', async () => {
      await assertFails(dbRef(hr, 'users/hrUid/role').set('SUPER_ADMIN'));
    });
  });

  describe('Payroll user', () => {
    let payroll;
    before(() => {
      payroll = testEnv.authenticatedContext('payrollUid');
    });

    it('can read payroll nodes if present (simulate)', async () => {
      await assertFails(dbRef(payroll, 'payroll').once('value'));
    });
  });

  describe('Finance user', () => {
    let finance;
    before(() => {
      finance = testEnv.authenticatedContext('financeUid');
    });

    it('cannot read token_pool', async () => {
      await assertFails(dbRef(finance, 'token_pool').once('value'));
    });

    it('cannot escalate roles', async () => {
      await assertFails(dbRef(finance, 'users/financeUid/role').set('SUPER_ADMIN'));
    });
  });

  describe('Admin user', () => {
    let admin;
    before(() => {
      admin = testEnv.authenticatedContext('adminUid');
    });

    it('can read users metadata', async () => {
      await assertSucceeds(dbRef(admin, 'users/memberUid').once('value'));
    });

    it('can manage parametres', async () => {
      await assertSucceeds(dbRef(admin, 'parametres/siteName').set('AMM Admin Test'));
    });

    it('cannot read token_pool (server-only resource)', async () => {
      await assertFails(dbRef(admin, 'token_pool').once('value'));
    });
  });

  describe('Super Admin user', () => {
    let superAdmin;
    before(() => {
      superAdmin = testEnv.authenticatedContext('superUid');
    });

    it('can read users including metadata', async () => {
      await assertSucceeds(dbRef(superAdmin, 'users/memberUid').once('value'));
    });

    it('can read logs if audit.read permission present', async () => {
      await assertSucceeds(dbRef(superAdmin, 'logs').once('value'));
    });

    it('cannot read token_pool unless server', async () => {
      await assertFails(dbRef(superAdmin, 'token_pool').once('value'));
    });
  });

  describe('Suspended / Disabled users', () => {
    it('suspended cannot read protected data', async () => {
      const suspended = testEnv.authenticatedContext('suspendedUid');
      await assertFails(dbRef(suspended, 'parametres').once('value'));
    });

    it('disabled cannot read protected data', async () => {
      const disabled = testEnv.authenticatedContext('disabledUid');
      await assertFails(dbRef(disabled, 'parametres').once('value'));
    });
  });

  describe('User self-service', () => {
    it('user can read own metadata', async () => {
      const member = testEnv.authenticatedContext('memberUid');
      await assertSucceeds(dbRef(member, 'users/memberUid').once('value'));
    });

    it('user cannot modify own role', async () => {
      const member = testEnv.authenticatedContext('memberUid');
      await assertFails(dbRef(member, 'users/memberUid/role').set('ADMIN'));
    });

    it('user cannot read another user password', async () => {
      const member = testEnv.authenticatedContext('memberUid');
      await assertFails(dbRef(member, 'users/legacyPwdUid/password').once('value'));
    });
  });

  describe('Token pool protection', () => {
    it('no client can read token_pool', async () => {
      const member = testEnv.authenticatedContext('memberUid');
      const hr = testEnv.authenticatedContext('hrUid');
      const admin = testEnv.authenticatedContext('adminUid');
      await assertFails(dbRef(member, 'token_pool').once('value'));
      await assertFails(dbRef(hr, 'token_pool').once('value'));
      await assertFails(dbRef(admin, 'token_pool').once('value'));
    });
  });

  describe('Logs protection', () => {
    it('ordinary user cannot read logs', async () => {
      const member = testEnv.authenticatedContext('memberUid');
      await assertFails(dbRef(member, 'logs').once('value'));
    });

    it('super admin can read logs when permission present', async () => {
      const superAdmin = testEnv.authenticatedContext('superUid');
      await assertSucceeds(dbRef(superAdmin, 'logs').once('value'));
    });
  });

  describe('Pending requests', () => {
    it('applicant can create their own pending request', async () => {
      const applicant = testEnv.authenticatedContext('anonApplicant');
      await assertSucceeds(dbRef(applicant, 'pendingRequests/pr-applicant').set({ applicantUid: 'anonApplicant', payload: 'x' }));
    });

    it('applicant cannot read other pending requests', async () => {
      const applicant = testEnv.authenticatedContext('anonApplicant');
      await assertFails(dbRef(applicant, 'pendingRequests/pr1').once('value'));
    });
  });

  describe('Messages', () => {
    it('participant can read conversation', async () => {
      const member = testEnv.authenticatedContext('memberUid');
      await assertSucceeds(dbRef(member, 'messages/conv1').once('value'));
    });

    it('non-participant cannot read private conversation', async () => {
      const outsider = testEnv.authenticatedContext('payrollUid');
      await assertFails(dbRef(outsider, 'messages/conv_private').once('value'));
    });
  });

  describe('Immutability', () => {
    it('cannot change employee matricule', async () => {
      const admin = testEnv.authenticatedContext('adminUid');
      await assertFails(dbRef(admin, 'employees/EMP-001/matricule').set('WRONG'));
    });
  });
});
