// src/RHAppModule.tsx
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout' 
import { ProtectedRoute } from './components/ProtectedRoute'
import { DashboardPage } from './pages/DashboardPage'
import { EmployeesPage } from './pages/EmployeesPage'
import { DepartmentsPage } from './pages/DepartmentsPage'
import { PositionsPage } from './pages/PositionsPage'
import { AttendancePage } from './pages/AttendancePage'
import { LeavePage } from './pages/LeavePage'
import { PayrollPage } from './pages/PayrollPage'
import { UsersPage } from './pages/UsersPage'
import { EmployeeDetailPage } from './pages/EmployeeDetailPage'
import { SettingsPage } from './pages/SettingsPage'
import { RHPage } from './pages/RHPage'
import { AccountingPage } from './pages/AccountingPage'
import { AproposPage } from './pages/AproposPage'
// Ampidiro eto ny pejinao ho an'ny Login (Ovay ny path raha ilaina)
import { LoginPage } from './pages/LoginPage' 

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

          <Route element={<ProtectedRoute requiredPermissions={['apropos']} />}>
            <Route path="/apropos" element={<AproposPage />} />
          </Route>
        </Route>
      </Route>

      {/* 3. LALANA TSY FANTATRA (Fallback) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}