import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '../services/authService'
import type { Role } from '../types'

export const RegisterPage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'RH' as Role })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setError('')
    const { user, error: authError } = await registerUser(form.email, form.password, form.role, form.name)
    setIsLoading(false)

    if (user) {
      navigate('/')
      return
    }

    setError(authError ?? 'Erreur lors de l’inscription')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">AMM RH</p>
        <h1 className="mt-3 text-3xl font-semibold">Créer un utilisateur RH</h1>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none" placeholder="Nom complet" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none" placeholder="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none" placeholder="Mot de passe" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
          <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Role })}>
            <option value="RH">RH</option>
            <option value="Comptable">Comptable</option>
            <option value="Directeur">Directeur</option>
            <option value="Super Admin">Super Admin</option>
          </select>
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          <button className="flex w-full items-center justify-center rounded-lg bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70" type="submit" disabled={isLoading}>
            {isLoading ? 'Création…' : 'Créer le compte'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-400">
          <Link className="text-cyan-400" to="/login">Retour à la connexion</Link>
        </p>
      </div>
    </div>
  )
}
