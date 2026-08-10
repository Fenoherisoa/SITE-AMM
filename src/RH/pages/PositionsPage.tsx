import { useEffect, useState } from 'react'
import { addPosition, deletePosition, getPositions, updatePosition } from '../services/employeesService'
import type { Position } from '../types'

export const PositionsPage = () => {
  const [positions, setPositions] = useState<Position[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const loadData = async () => {
    setPositions(await getPositions())
  }

  useEffect(() => {
    void loadData()
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (editingId) {
      await updatePosition(editingId, { name, description })
    } else {
      await addPosition({ name, description })
    }
    setName('')
    setDescription('')
    setEditingId(null)
    await loadData()
  }

  const handleEdit = (position: Position) => {
    setEditingId(position.id)
    setName(position.name)
    setDescription(position.description ?? '')
  }

  const handleDelete = async (id: string) => {
    await deletePosition(id)
    await loadData()
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Postes</p>
        <h2 className="mt-2 text-3xl font-semibold">CRUD postes</h2>
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form className="rounded-2xl border border-slate-800 bg-slate-900 p-5" onSubmit={handleSubmit}>
          <h3 className="text-xl font-semibold">{editingId ? 'Modifier' : 'Ajouter'} un poste</h3>
          <div className="mt-4 space-y-3">
            <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Nom" value={name} onChange={(event) => setName(event.target.value)} required />
            <textarea className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
          <button className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950" type="submit">Enregistrer</button>
        </form>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <ul className="space-y-3">
            {positions.map((position) => (
              <li key={position.id} className="flex items-center justify-between rounded-lg border border-slate-800 px-4 py-3">
                <div>
                  <p className="font-medium">{position.name}</p>
                  <p className="text-sm text-slate-400">{position.description ?? 'Sans description'}</p>
                </div>
                <div className="flex gap-2">
                  <button className="rounded bg-cyan-500/20 px-2 py-1 text-cyan-300" onClick={() => handleEdit(position)}>Modifier</button>
                  <button className="rounded bg-rose-500/20 px-2 py-1 text-rose-300" onClick={() => void handleDelete(position.id)}>Supprimer</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
