import { useEffect, useMemo, useState } from 'react'
import madagascarData from '../data/madagascarData'
import { createRHRecord, deleteRHRecord, getRHRecords, updateRHRecord } from '../services/rhService'
import type { RHRecord } from '../types'

const emptyForm = {
  anarana: '',
  genre: 'LAHY',
  date_naissance: '',
  lieu_naissance: '',
  cin: '',
  date_delivrance: '',
  lieu_delivrance: '',
  cin_recto: '',
  cin_verso: '',
  province: '',
  region: '',
  district: '',
  commune: '',
  fokontany: '',
  telephone: '',
  email_notification: '',
  tetikasa: '',
  date_adhesion: '',
}

export const RHPage = () => {
  const [records, setRecords] = useState<RHRecord[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const loadRecords = async () => {
    const data = await getRHRecords()
    setRecords(data)
  }

  useEffect(() => {
    void loadRecords()
  }, [])

  const provinceOptions = Object.keys(madagascarData)
  const selectedProvince = form.province ? madagascarData[form.province as keyof typeof madagascarData] : null
  const regionOptions = selectedProvince ? Object.keys(selectedProvince) : []
  const selectedRegion = form.region && selectedProvince ? selectedProvince[form.region as keyof typeof selectedProvince] : null
  const districtOptions = selectedRegion ? Object.keys(selectedRegion) : []
  const selectedDistrict = form.district && selectedRegion ? selectedRegion[form.district as keyof typeof selectedRegion] : null
  const communeOptions = selectedDistrict ? Object.keys(selectedDistrict) : []
  const fokontanyOptions = form.commune && selectedDistrict ? (selectedDistrict as Record<string, string[]>)[form.commune] ?? [] : []

  const filteredRecords = useMemo(() => {
    const term = searchTerm.toLowerCase()
    if (!term) return records

    return records.filter((record) => {
      const haystack = `${record.anarana} ${record.cin} ${record.matricule}`.toLowerCase()
      return haystack.includes(term)
    })
  }, [records, searchTerm])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setMessage('')
  }

  const handleChange = (field: string, value: string) => {
    setForm((current) => {
      if (field === 'province') {
        return { ...current, province: value, region: '', district: '', commune: '', fokontany: '' }
      }
      if (field === 'region') {
        return { ...current, region: value, district: '', commune: '', fokontany: '' }
      }
      if (field === 'district') {
        return { ...current, district: value, commune: '', fokontany: '' }
      }
      if (field === 'commune') {
        return { ...current, commune: value, fokontany: '' }
      }
      return { ...current, [field]: value }
    })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    setMessage('')

    const payload = {
      anarana: form.anarana,
      genre: form.genre,
      date_naissance: form.date_naissance,
      lieu_naissance: form.lieu_naissance,
      cin: form.cin,
      date_delivrance: form.date_delivrance,
      lieu_delivrance: form.lieu_delivrance,
      cin_recto: form.cin_recto,
      cin_verso: form.cin_verso,
      province: form.province,
      region: form.region,
      district: form.district,
      commune: form.commune,
      fokontany: form.fokontany,
      telephone: form.telephone,
      email_notification: form.email_notification,
      tetikasa: form.tetikasa,
      date_adhesion: form.date_adhesion,
    }

    if (editingId) {
      await updateRHRecord(editingId, payload)
      setMessage('Profil RH mis à jour.')
    } else {
      await createRHRecord(payload)
      setMessage('Nouveau profil RH créé.')
    }

    await loadRecords()
    resetForm()
    setIsSaving(false)
  }

  const handleEdit = (record: RHRecord) => {
    setEditingId(record.id)
    setForm({
      ...emptyForm,
      ...record,
      province: record.province ?? '',
      region: record.region ?? '',
      district: record.district ?? '',
      commune: record.commune ?? '',
      fokontany: record.fokontany ?? '',
    })
    setMessage('')
  }

  const handleDelete = async (id: string) => {
    await deleteRHRecord(id)
    setDeleteTarget(null)
    await loadRecords()
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">RH</p>
        <h2 className="mt-2 text-3xl font-semibold">Gestion des RH</h2>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">{editingId ? 'Modifier un RH' : 'Créer un RH'}</h3>
            <p className="mt-1 text-sm text-slate-400">Structure conforme /RH avec ID et matricule automatiques.</p>
          </div>
          {editingId ? <button className="rounded-lg border border-slate-700 px-3 py-2 text-sm" onClick={resetForm}>Annuler</button> : null}
        </div>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-slate-400">Anarana</label>
              <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={form.anarana} onChange={(event) => handleChange('anarana', event.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">Genre</label>
              <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={form.genre} onChange={(event) => handleChange('genre', event.target.value)}>
                <option value="LAHY">Lahy</option>
                <option value="VAVY">Vavy</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">Date de naissance</label>
              <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" type="date" value={form.date_naissance} onChange={(event) => handleChange('date_naissance', event.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">Lieu de naissance</label>
              <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={form.lieu_naissance} onChange={(event) => handleChange('lieu_naissance', event.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">CIN</label>
              <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={form.cin} onChange={(event) => handleChange('cin', event.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">Date de délivrance</label>
              <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={form.date_delivrance} onChange={(event) => handleChange('date_delivrance', event.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">Lieu de délivrance</label>
              <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={form.lieu_delivrance} onChange={(event) => handleChange('lieu_delivrance', event.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">CIN recto</label>
              <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={form.cin_recto} onChange={(event) => handleChange('cin_recto', event.target.value)} disabled />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">CIN verso</label>
              <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={form.cin_verso} onChange={(event) => handleChange('cin_verso', event.target.value)} disabled />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">Province</label>
              <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={form.province} onChange={(event) => handleChange('province', event.target.value)}>
                <option value="">Sélectionner</option>
                {provinceOptions.map((province) => <option key={province} value={province}>{province}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">Région</label>
              <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={form.region} onChange={(event) => handleChange('region', event.target.value)} disabled={!form.province}>
                <option value="">Sélectionner</option>
                {regionOptions.map((region) => <option key={region} value={region}>{region}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">District</label>
              <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={form.district} onChange={(event) => handleChange('district', event.target.value)} disabled={!form.region}>
                <option value="">Sélectionner</option>
                {districtOptions.map((district) => <option key={district} value={district}>{district}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">Commune</label>
              <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={form.commune} onChange={(event) => handleChange('commune', event.target.value)} disabled={!form.district}>
                <option value="">Sélectionner</option>
                {communeOptions.map((commune) => <option key={commune} value={commune}>{commune}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">Fokontany</label>
              <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={form.fokontany} onChange={(event) => handleChange('fokontany', event.target.value)} disabled={!form.commune}>
                <option value="">Sélectionner</option>
                {fokontanyOptions.map((fokontany) => <option key={fokontany} value={fokontany}>{fokontany}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">Téléphone</label>
              <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={form.telephone} onChange={(event) => handleChange('telephone', event.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">Email notification</label>
              <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" type="email" value={form.email_notification} onChange={(event) => handleChange('email_notification', event.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">Tetikasa</label>
              <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={form.tetikasa} onChange={(event) => handleChange('tetikasa', event.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">Date d’adhésion</label>
              <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" type="date" value={form.date_adhesion} onChange={(event) => handleChange('date_adhesion', event.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950" type="submit" disabled={isSaving}>
              {isSaving ? 'Enregistrement…' : editingId ? 'Mettre à jour' : 'Créer le RH'}
            </button>
            {message ? <span className="text-sm text-emerald-400">{message}</span> : null}
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-semibold">Liste RH</h3>
            <p className="text-sm text-slate-400">Recherche par anarana, CIN ou matricule.</p>
          </div>
          <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 md:w-80" placeholder="Rechercher..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="px-3 py-3">ID</th>
                <th className="px-3 py-3">Anarana</th>
                <th className="px-3 py-3">CIN</th>
                <th className="px-3 py-3">Matricule</th>
                <th className="px-3 py-3">Téléphone</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id} className="border-b border-slate-800/70">
                  <td className="px-3 py-3">{record.id}</td>
                  <td className="px-3 py-3">{record.anarana}</td>
                  <td className="px-3 py-3">{record.cin}</td>
                  <td className="px-3 py-3">{record.matricule}</td>
                  <td className="px-3 py-3">{record.telephone}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button className="rounded bg-cyan-500/20 px-2 py-1 text-cyan-300" onClick={() => handleEdit(record)}>Modifier</button>
                      <button className="rounded bg-rose-500/20 px-2 py-1 text-rose-300" onClick={() => setDeleteTarget(record.id)}>Supprimer</button>
                    </div>
                    {deleteTarget === record.id ? (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-slate-400">Confirmer la suppression ?</span>
                        <button className="rounded bg-rose-500 px-2 py-1 text-xs text-white" onClick={() => void handleDelete(record.id)}>Oui</button>
                        <button className="rounded border border-slate-700 px-2 py-1 text-xs" onClick={() => setDeleteTarget(null)}>Non</button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
