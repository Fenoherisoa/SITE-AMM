import { ref, get, set, update } from 'firebase/database';
import { database, isFirebaseConfigured } from './firebase';
import { Member } from '../types';

// Initial baseline seed data for association members if RTDB node is empty
const SEED_MEMBERS: Member[] = [
  {
    id: 'MBR-2026-001',
    fullName: 'Rasoa Norosoa',
    cin: '101 234 567 890',
    phone: '+261 34 12 345 67',
    email: 'norosoa.rasoa@amm.mg',
    address: 'Lot IVG 12, Antananarivo 101',
    status: 'ACTIVE',
    registrationDate: '2024-03-15',
    membershipType: 'Producteur',
    department: 'Agriculture & Agroécologie',
    notes: 'Pionnière du projet riziculture durable'
  },
  {
    id: 'MBR-2026-002',
    fullName: 'Jean-Luc Rakoto',
    cin: '201 987 654 321',
    phone: '+261 32 98 765 43',
    email: 'rakoto.jeanluc@amm.mg',
    address: 'Ambanidia, Antananarivo',
    status: 'ACTIVE',
    registrationDate: '2023-01-10',
    membershipType: 'Formateur',
    department: 'Formation Professionnelle',
    notes: 'Coordinateur de formation apiculture'
  },
  {
    id: 'MBR-2026-003',
    fullName: 'Hery Randrianarisoa',
    cin: '301 555 666 777',
    phone: '+261 33 44 555 66',
    email: 'hery.randri@amm.mg',
    address: 'Fianarantsoa Centre',
    status: 'PENDING',
    registrationDate: '2026-08-01',
    membershipType: 'Éleveur',
    department: 'Élevage & Santé Animale',
    notes: 'Candidature en cours de validation par le bureau'
  },
  {
    id: 'MBR-2026-004',
    fullName: 'Anja Rabemananjara',
    cin: '401 888 777 999',
    phone: '+261 34 88 777 99',
    email: 'anja.rabe@amm.mg',
    address: 'Bazar Be, Toamasina',
    status: 'SUSPENDED',
    registrationDate: '2025-05-20',
    membershipType: 'Artisan',
    department: 'Arts & Artisanat Culturel',
    notes: 'Cotisation en retard'
  }
];

class MemberService {
  private localMembersMap: Map<string, Member> = new Map();

  constructor() {
    // Seed local memory cache
    SEED_MEMBERS.forEach((m) => this.localMembersMap.set(m.id, m));
  }

  /**
   * Fetch all association members from Firebase RTDB /members or local store
   */
  public async getMembers(): Promise<Member[]> {
    if (isFirebaseConfigured && database) {
      try {
        const membersRef = ref(database, 'members');
        const snapshot = await get(membersRef);

        if (snapshot.exists()) {
          const data = snapshot.val();
          const list: Member[] = Object.keys(data).map((key) => ({
            ...data[key],
            id: key
          }));
          
          // Update local memory cache
          list.forEach((m) => this.localMembersMap.set(m.id, m));
          return list;
        }
      } catch (err) {
        console.warn('[MemberService] Could not load RTDB members:', err);
      }
    }

    return Array.from(this.localMembersMap.values());
  }

  /**
   * Retrieve single member by ID
   */
  public async getMemberById(id: string): Promise<Member | null> {
    const members = await this.getMembers();
    return members.find((m) => m.id === id) || null;
  }

  /**
   * Create a new member with validation against duplicate CIN or Email
   */
  public async createMember(data: Omit<Member, 'id' | 'createdAt'>): Promise<Member> {
    const members = await this.getMembers();

    // Validation
    const cleanCin = data.cin.replace(/\s+/g, '').trim();
    const cleanEmail = data.email.trim().toLowerCase();

    if (!data.fullName || !data.fullName.trim()) {
      throw new Error('Le nom complet du membre est obligatoire.');
    }

    if (!cleanCin || cleanCin.length < 5) {
      throw new Error('Numéro CIN invalide.');
    }

    // Check duplicate CIN
    const existingCin = members.find((m) => m.cin.replace(/\s+/g, '').trim() === cleanCin);
    if (existingCin) {
      throw new Error(`Un membre existe déjà avec le numéro CIN ${data.cin} (${existingCin.fullName}).`);
    }

    // Check duplicate Email
    if (cleanEmail) {
      const existingEmail = members.find((m) => m.email.trim().toLowerCase() === cleanEmail);
      if (existingEmail) {
        throw new Error(`L'adresse e-mail ${data.email} est déjà attribuée au membre ${existingEmail.fullName}.`);
      }
    }

    const newId = `MBR-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const now = new Date().toISOString();

    const newMember: Member = {
      ...data,
      id: newId,
      cin: data.cin.trim(),
      email: cleanEmail,
      fullName: data.fullName.trim(),
      registrationDate: data.registrationDate || now.split('T')[0],
      status: data.status || 'ACTIVE',
      createdAt: now,
      updatedAt: now
    };

    // Save to RTDB
    if (isFirebaseConfigured && database) {
      try {
        const memberRef = ref(database, `members/${newId}`);
        await set(memberRef, newMember);
      } catch (err) {
        console.warn('[MemberService] Could not write member to RTDB:', err);
      }
    }

    this.localMembersMap.set(newId, newMember);
    return newMember;
  }

  /**
   * Update an existing member
   */
  public async updateMember(id: string, updates: Partial<Member>): Promise<Member> {
    const members = await this.getMembers();
    const existingIndex = members.findIndex((m) => m.id === id);

    if (existingIndex === -1) {
      throw new Error(`Membre non trouvé avec l'identifiant ${id}.`);
    }

    const currentMember = members[existingIndex];

    // Check duplicate CIN if CIN is updated
    if (updates.cin && updates.cin.trim() !== currentMember.cin.trim()) {
      const cleanCin = updates.cin.replace(/\s+/g, '').trim();
      const duplicate = members.find((m) => m.id !== id && m.cin.replace(/\s+/g, '').trim() === cleanCin);
      if (duplicate) {
        throw new Error(`Un autre membre possède déjà le CIN ${updates.cin} (${duplicate.fullName}).`);
      }
    }

    // Check duplicate Email if email is updated
    if (updates.email && updates.email.trim().toLowerCase() !== currentMember.email.trim().toLowerCase()) {
      const cleanEmail = updates.email.trim().toLowerCase();
      const duplicate = members.find((m) => m.id !== id && m.email.trim().toLowerCase() === cleanEmail);
      if (duplicate) {
        throw new Error(`Un autre membre utilise déjà l'adresse e-mail ${updates.email} (${duplicate.fullName}).`);
      }
    }

    const updatedMember: Member = {
      ...currentMember,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (isFirebaseConfigured && database) {
      try {
        const memberRef = ref(database, `members/${id}`);
        await update(memberRef, updatedMember);
      } catch (err) {
        console.warn('[MemberService] Could not update member in RTDB:', err);
      }
    }

    this.localMembersMap.set(id, updatedMember);
    return updatedMember;
  }

  /**
   * Safely archive a member (soft-delete to preserve attendance and historical records)
   */
  public async archiveMember(id: string): Promise<Member> {
    return this.updateMember(id, { status: 'ARCHIVED' });
  }

  /**
   * Filter and search members helper
   */
  public searchMembers(
    members: Member[],
    query: string,
    statusFilter?: string,
    categoryFilter?: string
  ): Member[] {
    const q = query.trim().toLowerCase();

    return members.filter((m) => {
      // Query match (Name, CIN, Phone, Email, Address, Notes)
      const matchesQuery =
        !q ||
        m.fullName.toLowerCase().includes(q) ||
        m.cin.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.address && m.address.toLowerCase().includes(q)) ||
        (m.id && m.id.toLowerCase().includes(q));

      // Status filter
      const matchesStatus = !statusFilter || statusFilter === 'ALL' || m.status === statusFilter;

      // Category filter
      const matchesCategory =
        !categoryFilter || categoryFilter === 'ALL' || m.membershipType === categoryFilter;

      return matchesQuery && matchesStatus && matchesCategory;
    });
  }
}

export const memberService = new MemberService();
