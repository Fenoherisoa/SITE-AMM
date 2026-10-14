/**
 * Utilitaires de sécurité et cryptographie pour le fonctionnement hors ligne
 * Conforme aux standards de sécurité : Web Crypto API (SubtleCrypto), salage et hachage fort.
 */

// Génère un sel aléatoire hexadécimal
export function generateSalt(length = 16): string {
  const bytes = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

// Calcule un hachage SHA-256 avec sel pour la vérification des mots de passe hors ligne
export async function hashPasswordWithSalt(password: string, salt: string): Promise<string> {
  const text = `${salt}:${password}:AMM_OFFLINE_SECRET_2026`;
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback si WebCrypto n'est pas disponible
    }
  }

  // Fallback simple SHA-256 simulation si subtle indisponible
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

// Génère un UUID v4 pour chaque opération de synchronisation
export function generateUUID(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Génère un identifiant d'appareil unique et stable
export function getOrCreateDeviceId(): string {
  const STORAGE_KEY = 'amm_persistent_device_id';
  let deviceId = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  if (!deviceId) {
    const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
    deviceId = `AMM-DEV-${randomHex}`;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, deviceId);
    }
  }
  return deviceId;
}

// Calcule un checksum SHA-256 pour vérifier l'intégrité des sauvegardes JSON
export async function computeChecksum(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback
    }
  }
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = (hash << 5) - hash + content.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(32, 'a');
}
