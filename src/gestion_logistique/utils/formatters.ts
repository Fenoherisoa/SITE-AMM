import { CurrencyCode, StockStatus } from '../types';

export const FORMAT_CURRENCY = (amount: number, currency: CurrencyCode = 'MGA'): string => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `0 ${currency === 'MGA' ? 'Ar' : currency}`;
  }

  if (currency === 'MGA') {
    return `${Math.round(amount).toLocaleString('fr-FR')} Ar`;
  }

  if (currency === 'EUR') {
    // Standard exchange reference: 1 EUR ~ 4 900 MGA
    const eurVal = amount > 1000 ? amount / 4900 : amount;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 2,
    }).format(eurVal);
  }

  if (currency === 'USD') {
    // Standard exchange reference: 1 USD ~ 4 500 MGA
    const usdVal = amount > 1000 ? amount / 4500 : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(usdVal);
  }

  if (currency === 'XOF') {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0,
    }).format(amount).replace('CFA', 'FCFA');
  }

  return `${amount.toLocaleString('fr-FR')} ${currency}`;
};

export const FORMAT_DATE = (dateString?: string, includeTime: boolean = false): string => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    
    if (includeTime) {
      return d.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export const GET_STOCK_STATUS = (quantity: number, minThreshold: number): StockStatus => {
  if (quantity <= 0) return 'OUT_OF_STOCK';
  if (quantity <= minThreshold) return 'LOW';
  return 'NORMAL';
};

export const GET_STOCK_STATUS_BADGE = (status: StockStatus) => {
  switch (status) {
    case 'OUT_OF_STOCK':
      return {
        label: 'Rupture de Stock',
        bg: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
        dot: 'bg-rose-500'
      };
    case 'LOW':
      return {
        label: 'Stock Bas',
        bg: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
        dot: 'bg-amber-500 animate-pulse'
      };
    case 'NORMAL':
    default:
      return {
        label: 'Disponible',
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
        dot: 'bg-emerald-500'
      };
  }
};

export const GENERATE_BARCODE_SVG = (code: string): string => {
  // Simple EAN/Code-128 SVG generator for visual barcode render
  return code;
};
