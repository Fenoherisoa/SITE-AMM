import React, { useState, useEffect } from 'react';
import { X, ArrowLeftRight, Save, ArrowDownLeft, ArrowUpRight, RefreshCw } from 'lucide-react';
import { InventoryItem, StockMovement, MovementType } from '../types';

interface MovementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (movement: StockMovement) => void;
  items: InventoryItem[];
  defaultType?: MovementType;
  locations: string[];
}

export const MovementFormModal: React.FC<MovementFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  items,
  defaultType = 'IN',
  locations
}) => {
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id || '');
  const [type, setType] = useState<MovementType>(defaultType);
  const [quantity, setQuantity] = useState(1);
  const [sourceLocation, setSourceLocation] = useState(locations[0] || 'Entrepôt Principal (Siège)');
  const [targetLocation, setTargetLocation] = useState(locations[1] || 'Bureau Central');
  const [reason, setReason] = useState('Achats / Approvisionnement');
  const [referenceDoc, setReferenceDoc] = useState('');
  const [handlerName, setHandlerName] = useState('M. Ibrahim Diop (Resp. Logistique)');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setType(defaultType);
    if (items.length > 0 && !selectedItemId) {
      setSelectedItemId(items[0].id);
    }
  }, [defaultType, items, isOpen]);

  if (!isOpen) return null;

  const selectedItem = items.find(i => i.id === selectedItemId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const unitPrice = selectedItem.unitPrice;
    const totalPrice = Number(quantity) * unitPrice;

    const newMov: StockMovement = {
      id: `MOV-${Date.now().toString().slice(-4)}`,
      itemId: selectedItem.id,
      itemCode: selectedItem.code,
      itemName: selectedItem.name,
      type,
      quantity: Number(quantity),
      unitPrice,
      totalPrice,
      sourceLocation: type === 'IN' ? undefined : sourceLocation,
      targetLocation: type === 'OUT' ? undefined : targetLocation,
      reason,
      referenceDoc: referenceDoc || `DOC-${Date.now().toString().slice(-5)}`,
      handlerName,
      timestamp: new Date().toISOString(),
      notes
    };

    onSave(newMov);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Nouveau Mouvement de Stock
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Movement Type Radio Selector */}
          <div>
            <label className="block font-semibold mb-1.5">Type d'Opération *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setType('IN')}
                className={`py-2 px-2 rounded-xl font-bold text-center border transition-all ${
                  type === 'IN' ? 'bg-emerald-600 text-white border-emerald-500 shadow' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                + ENTRÉE
              </button>
              <button
                type="button"
                onClick={() => setType('OUT')}
                className={`py-2 px-2 rounded-xl font-bold text-center border transition-all ${
                  type === 'OUT' ? 'bg-rose-600 text-white border-rose-500 shadow' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                - SORTIE
              </button>
              <button
                type="button"
                onClick={() => setType('TRANSFER')}
                className={`py-2 px-2 rounded-xl font-bold text-center border transition-all ${
                  type === 'TRANSFER' ? 'bg-indigo-600 text-white border-indigo-500 shadow' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                TRANSFERT
              </button>
              <button
                type="button"
                onClick={() => setType('ADJUSTMENT')}
                className={`py-2 px-2 rounded-xl font-bold text-center border transition-all ${
                  type === 'ADJUSTMENT' ? 'bg-amber-600 text-white border-amber-500 shadow' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                AJUSTEMENT
              </button>
            </div>
          </div>

          {/* Item Selector */}
          <div>
            <label className="block font-semibold mb-1">Sélectionner l'Article Concerne *</label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-semibold outline-none"
            >
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  [{item.code}] {item.name} — Stock Actuel: {item.quantity} units
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Quantité Impactée *</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-extrabold text-base outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Motif / Justification *</label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="ex: Achats, Distribution, Perte..."
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
              />
            </div>
          </div>

          {(type === 'OUT' || type === 'TRANSFER' || type === 'ADJUSTMENT') && (
            <div>
              <label className="block font-semibold mb-1">Dépôt Source</label>
              <select
                value={sourceLocation}
                onChange={(e) => setSourceLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
              >
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          )}

          {(type === 'IN' || type === 'TRANSFER') && (
            <div>
              <label className="block font-semibold mb-1">Dépôt Cible / Destination</label>
              <select
                value={targetLocation}
                onChange={(e) => setTargetLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
              >
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">N° Document Justificatif (BL / Facture)</label>
              <input
                type="text"
                value={referenceDoc}
                onChange={(e) => setReferenceDoc(e.target.value)}
                placeholder="ex: BL-2026-089"
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Agent Responsable *</label>
              <input
                type="text"
                required
                value={handlerName}
                onChange={(e) => setHandlerName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Notes Complémentaires</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Inscrire observations sur le lot..."
              className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
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
              <span>Valider Mouvement</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
