import React, { useState, useEffect } from 'react';
import { X, Boxes, Save, Plus } from 'lucide-react';
import { InventoryItem, CategoryName, ItemCondition } from '../types';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
  initialItem?: InventoryItem | null;
  locations: string[];
  suppliers: string[];
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
  locations,
  suppliers
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryName>('Équipement Informatique');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [minThreshold, setMinThreshold] = useState(2);
  const [unitPrice, setUnitPrice] = useState(0);
  const [location, setLocation] = useState(locations[0] || 'Entrepôt Principal (Siège)');
  const [condition, setCondition] = useState<ItemCondition>('Neuf');
  const [supplierName, setSupplierName] = useState(suppliers[0] || 'TechPro Solutions SARL');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (initialItem) {
      setCode(initialItem.code);
      setName(initialItem.name);
      setCategory(initialItem.category);
      setDescription(initialItem.description);
      setQuantity(initialItem.quantity);
      setMinThreshold(initialItem.minThreshold);
      setUnitPrice(initialItem.unitPrice);
      setLocation(initialItem.location);
      setCondition(initialItem.condition);
      setSupplierName(initialItem.supplierName);
      setImageUrl(initialItem.imageUrl || '');
    } else {
      // Auto generate code SKU
      setCode(`LOG-${Date.now().toString().slice(-6)}`);
      setName('');
      setCategory('Équipement Informatique');
      setDescription('');
      setQuantity(1);
      setMinThreshold(2);
      setUnitPrice(50000);
      setLocation(locations[0] || 'Entrepôt Principal (Siège)');
      setCondition('Neuf');
      setSupplierName(suppliers[0] || 'TechPro Solutions SARL');
      setImageUrl('');
    }
  }, [initialItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) return;

    const totalVal = Number(quantity) * Number(unitPrice);
    const now = new Date().toISOString();

    const newItem: InventoryItem = {
      id: initialItem ? initialItem.id : `ITEM-${Date.now().toString().slice(-4)}`,
      code,
      name,
      category,
      description,
      quantity: Number(quantity),
      minThreshold: Number(minThreshold),
      unitPrice: Number(unitPrice),
      totalValue: totalVal,
      location,
      condition,
      supplierName,
      lastRestockDate: now.slice(0, 10),
      barcode: initialItem?.barcode || `3700${Date.now().toString().slice(-9)}`,
      imageUrl,
      createdAt: initialItem ? initialItem.createdAt : now.slice(0, 10),
      updatedAt: now.slice(0, 10)
    };

    onSave(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Boxes className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {initialItem ? 'Éditer la Fiche Article' : 'Nouveau Fiche Article / Équipement'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Code SKU / Référence *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="ex: LOG-INF-001"
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Catégorie d'Équipement *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryName)}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
              >
                <option value="Équipement Informatique">Équipement Informatique</option>
                <option value="Matériel Roulant & Transport">Matériel Roulant & Transport</option>
                <option value="Mobilier de Bureau">Mobilier de Bureau</option>
                <option value="Matériel Événementiel & Audiovisuel">Matériel Événementiel & Audiovisuel</option>
                <option value="Consommables & Fournitures">Consommables & Fournitures</option>
                <option value="Secours & Kit Médical">Secours & Kit Médical</option>
                <option value="Outillage & Maintenance">Outillage & Maintenance</option>
                <option value="Autres Équipements">Autres Équipements</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Désignation de l'Article *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Ordinateur Portable Dell Latitude 5540"
              className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Description Technique & Spécifications</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Inscrire numéro de série, marque, caractéristiques..."
              className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold mb-1">Quantité Initiale *</label>
              <input
                type="number"
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Seuil Alerte Stock Bas *</label>
              <input
                type="number"
                min="1"
                required
                value={minThreshold}
                onChange={(e) => setMinThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none font-bold text-amber-600"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Prix Unitaire D'Achat *</label>
              <input
                type="number"
                min="0"
                required
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold mb-1">Emplacement / Entrepôt</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
              >
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">État Physique</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ItemCondition)}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
              >
                <option value="Neuf">Neuf</option>
                <option value="Bon état">Bon état</option>
                <option value="À réparer">À réparer</option>
                <option value="Défectueux">Défectueux</option>
                <option value="Hors service">Hors service</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Fournisseur Attribué</label>
              <select
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
              >
                {suppliers.map(sup => (
                  <option key={sup} value={sup}>{sup}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">URL Image (Optionnel)</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-semibold text-xs"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
            >
              <Save className="h-4 w-4" />
              <span>Enregistrer Fiche</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
