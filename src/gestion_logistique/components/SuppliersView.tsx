import React, { useState } from 'react';
import { Users, Phone, Mail, MapPin, Tag, Star, Plus, Search, Building } from 'lucide-react';
import { Supplier, CategoryName } from '../types';

interface SuppliersViewProps {
  suppliers: Supplier[];
  onAddSupplier: (supplier: Supplier) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers,
  onAddSupplier
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Modal form state
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [categorySpecialty, setCategorySpecialty] = useState<CategoryName>('Équipement Informatique');
  const [taxId, setTaxId] = useState('');
  const [notes, setNotes] = useState('');

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.categorySpecialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const newSup: Supplier = {
      id: `SUP-${Date.now().toString().slice(-4)}`,
      name,
      contactPerson,
      email,
      phone,
      address,
      categorySpecialty,
      taxId,
      rating: 5,
      notes
    };

    onAddSupplier(newSup);
    setShowModal(false);
    setName('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setAddress('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span>Répertoire des Fournisseurs & Prestataires Agréés</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Partenaires techniques pour les approvisionnements et la maintenance de l'équipement AMM
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>+ Ajouter Fournisseur</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par raison sociale, contact, spécialité..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((s) => (
          <div 
            key={s.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  {s.id}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {s.name}
                </h3>
              </div>
              <div className="flex items-center text-amber-500 text-xs font-bold gap-0.5">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>{s.rating || 5}.0</span>
              </div>
            </div>

            <div className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {s.categorySpecialty}
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <span>Contact: <b>{s.contactPerson}</b></span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <a href={`mailto:${s.email}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  {s.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <a href={`tel:${s.phone}`} className="hover:underline">
                  {s.phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>{s.address}</span>
              </div>
            </div>

            {s.notes && (
              <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-100 dark:border-slate-800">
                "{s.notes}"
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Add Supplier Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Nouveau Fournisseur / Partenaire
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Raison Sociale *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: TechPro Solutions SARL"
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Nom du Contact</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="ex: Amadou Diallo"
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+221 77 000 00 00"
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@fournisseur.com"
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Spécialité Catégorie</label>
                  <select
                    value={categorySpecialty}
                    onChange={(e) => setCategorySpecialty(e.target.value as CategoryName)}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
                  >
                    <option value="Équipement Informatique">Équipement Informatique</option>
                    <option value="Matériel Roulant & Transport">Matériel Roulant & Transport</option>
                    <option value="Mobilier de Bureau">Mobilier de Bureau</option>
                    <option value="Matériel Événementiel & Audiovisuel">Matériel Événementiel & Audiovisuel</option>
                    <option value="Consommables & Fournitures">Consommables & Fournitures</option>
                    <option value="Secours & Kit Médical">Secours & Kit Médical</option>
                    <option value="Outillage & Maintenance">Outillage & Maintenance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Adresse</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Dakar, Senegal"
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Notes & Modalités</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Modalités de paiement, délais de livraison..."
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-semibold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
