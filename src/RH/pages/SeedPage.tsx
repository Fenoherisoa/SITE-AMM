import { useEffect, useState } from 'react'
import { seedInitialData } from '../data/seedData'

export const SeedPage = () => {
  const [status, setStatus] = useState('Prêt à initialiser')

  useEffect(() => {
    const run = async () => {
      try {
        await seedInitialData()
        setStatus('Données initiales ajoutées')
      } catch (error) {
        setStatus('Erreur lors de l’initialisation')
        console.error(error)
      }
    }

    void run()
  }, [])

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-300">
      <h2 className="text-xl font-semibold">Initialisation RH</h2>
      <p className="mt-2 text-sm text-slate-400">{status}</p>
    </div>
  )
}
