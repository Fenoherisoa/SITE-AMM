import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const baseNavItems = [
  { to: '/', label: 'Dashboard', permission: 'overview' },
  { to: '/employees', label: 'Employés', permission: 'members' },
  { to: '/rh', label: 'RH', permission: 'members' },
  { to: '/departments', label: 'Départements', permission: 'members' },
  { to: '/positions', label: 'Postes', permission: 'members' },
  { to: '/attendance', label: 'Présence', permission: 'calendar' },
  { to: '/leave', label: 'Congés', permission: 'calendar' },
  { to: '/payroll', label: 'Paie', permission: 'accounting' },
  { to: '/accounting', label: 'Comptabilité', permission: 'accounting' },
  { to: '/users', label: 'Utilisateurs', permission: 'security' },
  { to: '/settings', label: 'Paramètres', permission: 'parametre' },
]

export const Layout = () => {
  const { user, signOut, permissions } = useAuth()

  const navItems = baseNavItems.filter((item) => {
    if (item.to === '/') return true
    return Boolean(permissions[item.permission])
  })

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="w-full border-b border-slate-800 bg-slate-900/80 p-6 lg:w-72 lg:border-b-0 lg:border-r">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">AMM RH</p>
            <h1 className="mt-2 text-2xl font-semibold">Système RH</h1>
            <p className="mt-2 text-sm text-slate-400">Gestion indépendante des employés</p>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block rounded-lg px-4 py-3 text-sm font-medium transition ${isActive ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-300 hover:bg-slate-800'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-sm">
            <p className="font-semibold">{user?.name ?? user?.username ?? 'Utilisateur'}</p>
            <p className="text-slate-400">{user?.role ?? 'RH'}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-cyan-400">Accès RH</p>
            <button className="mt-3 rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700" onClick={() => signOut()}>
              Déconnexion
            </button>
          </div>
        </aside>
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
