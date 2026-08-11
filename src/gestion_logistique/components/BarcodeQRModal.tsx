import React from 'react';
import { X, QrCode, Printer, ShieldCheck, Download } from 'lucide-react';
import { InventoryItem } from '../types';

interface BarcodeQRModalProps {
  item: InventoryItem | null;
  onClose: () => void;
}

export const BarcodeQRModal: React.FC<BarcodeQRModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    `SITE-AMM|SKU:${item.code}|NAME:${item.name}|LOC:${item.location}`
  )}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 text-center">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Étiquette QR Code & Barcode
          </span>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Printable Tag Container */}
        <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-3 print:border-none">
          <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>SITE-AMM LOGISTIQUE</span>
          </div>

          <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
            {item.name}
          </h3>

          <div className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 inline-block">
            {item.code}
          </div>

          <div className="bg-white p-3 rounded-lg shadow-inner inline-block border border-slate-200">
            <img src={qrDataUrl} alt="QR Code Tag" className="h-36 w-36 mx-auto" />
          </div>

          {/* Barcode Visual Strip */}
          <div className="space-y-1">
            <div className="h-8 bg-slate-900 dark:bg-white rounded flex items-center justify-center font-mono text-[10px] text-white dark:text-slate-900 font-extrabold tracking-[4px]">
              ||| |||| | |||| ||
            </div>
            <span className="text-[10px] font-mono text-slate-400 block">
              {item.barcode}
            </span>
          </div>

          <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-1">
            Emplacement: <b>{item.location}</b>
          </div>
        </div>

        {/* Print Button */}
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={handlePrint}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimer Étiquette</span>
          </button>
        </div>

      </div>
    </div>
  );
};
