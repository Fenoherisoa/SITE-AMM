/**
 * Formateur monétaire officiel pour Madagascar (MGA / Ariary)
 * Conforme aux exigences de publication : affichage standard '5 000 MGA', '125 000 MGA', etc.
 */

export const MGA_CURRENCY_CODE = 'MGA';
export const MGA_CURRENCY_LABEL = 'MGA';
export const MGA_LOCALE = 'fr-MG';

/**
 * Formate un montant en Ariary Malagasy (MGA) avec séparateur de milliers
 * @example
 * formatMGA(5000) => "5 000 MGA"
 * formatMGA(125000) => "125 000 MGA"
 * formatMGA(1250000) => "1 250 000 MGA"
 */
export function formatMGA(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') {
    return '0 MGA';
  }

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) {
    return '0 MGA';
  }

  // Vérification de présence de décimales significatives
  const hasDecimals = Math.abs(num % 1) > 0.001;
  const digits = hasDecimals ? 2 : 0;

  try {
    const formatted = new Intl.NumberFormat(MGA_LOCALE, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(num);

    // Si le runtime Intl met 'Ar' ou autre symbole, on normalise explicitement avec 'MGA'
    const cleanNumber = formatted.replace(/[^\d\s,.-]/g, '').trim();
    return `${cleanNumber} MGA`;
  } catch {
    // Fallback standard si Intl n'est pas disponible pour fr-MG
    const parts = num.toFixed(digits).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    const fallbackStr = parts.join(',');
    return `${fallbackStr} MGA`;
  }
}

/**
 * Formate uniquement le nombre avec des séparateurs d'espaces (ex: "125 000")
 */
export function formatNumberMGA(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') {
    return '0';
  }

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) {
    return '0';
  }

  const hasDecimals = Math.abs(num % 1) > 0.001;
  const digits = hasDecimals ? 2 : 0;

  return new Intl.NumberFormat(MGA_LOCALE, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(num).replace(/[^\d\s,.-]/g, '').trim();
}
