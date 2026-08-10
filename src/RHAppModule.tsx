// src/RHAppModule.tsx
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './RH/components/Layout' 
import { ProtectedRoute } from './RH/components/ProtectedRoute'
import { DashboardPage } from './RH/pages/DashboardPage'
import { EmployeesPage } from './RH/pages/EmployeesPage'
import { DepartmentsPage } from './RH/pages/DepartmentsPage'
import { PositionsPage } from './RH/pages/PositionsPage'
import { AttendancePage } from './RH/pages/AttendancePage'
import { LeavePage } from './RH/pages/LeavePage'
import { PayrollPage } from './RH/pages/PayrollPage'
import { UsersPage } from './RH/pages/UsersPage'
import { EmployeeDetailPage } from './RH/pages/EmployeeDetailPage'
import { SettingsPage } from './RH/pages/SettingsPage'
import { RHPage } from './RH/pages/RHPage'
import { AccountingPage } from './RH/pages/AccountingPage'
// Ampidiro eto ny pejinao ho an'ny Login (Ovay ny path raha ilaina)
import { LoginPage } from './RH/pages/LoginPage' 

export default function RHAppModule() {
  return (
    <Routes>
      {/* 1. LALANA TSY VOAARO (Azo idirana avy hatrany) */}
      <Route path="/login" element={<LoginPage />} />

      {/* 2. LALANA VOAARO (Tsy maintsy misy user/login vao tafiditra eto) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route element={<ProtectedRoute requiredPermissions={['overview']} />}>
            <Route path="/" element={<DashboardPage />} />
          </Route>
          
          <Route element={<ProtectedRoute requiredPermissions={['members']} />}>
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/employees/:id" element={<EmployeeDetailPage />} />
            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/positions" element={<PositionsPage />} />
            <Route path="/rh" element={<RHPage />} />
          </Route>
          
          <Route element={<ProtectedRoute requiredPermissions={['calendar']} />}>
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/leave" element={<LeavePage />} />
          </Route>
          
          <Route element={<ProtectedRoute requiredPermissions={['accounting']} />}>
            <Route path="/payroll" element={<PayrollPage />} />
            <Route path="/accounting" element={<AccountingPage />} />
          </Route>
          
          <Route element={<ProtectedRoute requiredPermissions={['security']} />}>
            <Route path="/users" element={<UsersPage />} />
          </Route>
          
          <Route element={<ProtectedRoute requiredPermissions={['parametre']} />}>
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>

      {/* 3. LALANA TSY FANTATRA (Fallback) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}