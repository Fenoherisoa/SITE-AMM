import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const LoginPage = () => {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setError('')
    const { user: loggedUser, error: authError } = await signIn(email, password)
    setIsLoading(false)

    if (loggedUser) {
      navigate('/')
      return
    }

    setError(authError ?? 'Erreur Firebase connexion')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">AMM RH</p>
        <h1 className="mt-3 text-3xl font-semibold">Connexion RH</h1>
        <p className="mt-2 text-sm text-slate-400">Accédez à la gestion des employés et de la paie.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none" placeholder="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none" placeholder="Mot de passe" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          <button className="flex w-full items-center justify-center rounded-lg bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70" type="submit" disabled={isLoading}>
            {isLoading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
