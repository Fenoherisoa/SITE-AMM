import { useEffect, useState } from 'react'
import { get, ref, set } from 'firebase/database'
import { db } from '../firebase/firebaseConfig'

interface CompanySettings {
  companyName: string
  companyEmail: string
  phone: string
  address: string
  currency: string
  defaultWorkHours: string
}

const defaultSettings: CompanySettings = {
  companyName: 'AMM RH',
  companyEmail: 'contact@amm-rh.com',
  phone: '+261 00 000 00',
  address: 'Antananarivo, Madagascar',
  currency: 'Ar',
  defaultWorkHours: '8h',
}

export const SettingsPage = () => {
  const [settings, setSettings] = useState<CompanySettings>(defaultSettings)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      const snapshot = await get(ref(db, 'settings/company'))
      if (snapshot.exists()) {
        setSettings({ ...defaultSettings, ...snapshot.val() } as CompanySettings)
      }
    }

    void loadSettings()
  }, [])

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    await set(ref(db, 'settings/company'), settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Paramètres</p>
        <h2 className="mt-2 text-3xl font-semibold">Configuration RH</h2>
      </div>
      <form className="rounded-2xl border border-slate-800 bg-slate-900 p-6" onSubmit={handleSave}>
        <div className="grid gap-4 md:grid-cols-2">
          <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Nom de l’entreprise" value={settings.companyName} onChange={(event) => setSettings({ ...settings, companyName: event.target.value })} />
          <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Email entreprise" value={settings.companyEmail} onChange={(event) => setSettings({ ...settings, companyEmail: event.target.value })} />
          <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Téléphone" value={settings.phone} onChange={(event) => setSettings({ ...settings, phone: event.target.value })} />
          <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Adresse" value={settings.address} onChange={(event) => setSettings({ ...settings, address: event.target.value })} />
          <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Devise" value={settings.currency} onChange={(event) => setSettings({ ...settings, currency: event.target.value })} />
          <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Heures de travail par défaut" value={settings.defaultWorkHours} onChange={(event) => setSettings({ ...settings, defaultWorkHours: event.target.value })} />
        </div>
        <button className="mt-5 rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950" type="submit">Enregistrer</button>
        {saved ? <span className="ml-3 text-sm text-emerald-400">Enregistré</span> : null}
      </form>
    </div>
  )
}
