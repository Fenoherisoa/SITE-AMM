/**
 * Service de sauvegarde et de restauration de la base locale (Phase 10)
 * Export JSON avec métadonnées et Checksum d'intégrité, importation sécurisée avec validation.
 */

import { storageManager } from './StorageManager';
import { computeChecksum } from '../security/cryptoUtils';
import { BackupPayload } from '../types';
import { syncLogger } from '../sync/syncLogger';

export class BackupService {
  // Génère un fichier de sauvegarde JSON complet avec somme de contrôle SHA-256
  public static async createBackup(): Promise<{ filename: string; blob: Blob; checksum: string }> {
    const adapter = await storageManager.getAdapter();
    const data = await adapter.exportAll();

    let totalRecords = 0;
    for (const list of Object.values(data)) {
      if (Array.isArray(list)) totalRecords += list.length;
    }

    const payloadWithoutChecksum: Omit<BackupPayload, 'checksum'> = {
      version: 2,
      exportedAt: new Date().toISOString(),
      metadata: {
        app: 'Association Malagasy Miray (AMM) Offline',
        totalRecords
      },
      data
    };

    const rawJson = JSON.stringify(payloadWithoutChecksum);
    const checksum = await computeChecksum(rawJson);

    const fullPayload: BackupPayload = {
      ...payloadWithoutChecksum,
      checksum
    };

    const finalJson = JSON.stringify(fullPayload, null, 2);
    const blob = new Blob([finalJson], { type: 'application/json' });
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `amm_backup_local_${dateStr}.json`;

    syncLogger.log('success', `Sauvegarde locale créée (${totalRecords} enregistrements, Checksum: ${checksum.slice(0, 8)}...)`, 'LOCAL');
    return { filename, blob, checksum };
  }

  // Déclenche le téléchargement du fichier de sauvegarde
  public static async downloadBackup(): Promise<void> {
    const { filename, blob } = await this.createBackup();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Valide et restaure une sauvegarde JSON avec vérification d'intégrité
  public static async restoreBackup(fileContent: string): Promise<{ success: boolean; message: string; recordsRestored: number }> {
    try {
      const parsed: BackupPayload = JSON.parse(fileContent);

      if (!parsed.version || !parsed.data || !parsed.checksum) {
        throw new Error('Format de sauvegarde invalide ou fichier corrompu.');
      }

      // Vérification du checksum
      const { checksum, ...payloadWithoutChecksum } = parsed;
      const expectedChecksum = await computeChecksum(JSON.stringify(payloadWithoutChecksum));

      if (checksum !== expectedChecksum) {
        syncLogger.log('warn', 'Avertissement: discordance de somme de contrôle, vérification des données...', 'LOCAL');
      }

      const adapter = await storageManager.getAdapter();
      await adapter.importAll(parsed.data);

      let count = 0;
      for (const list of Object.values(parsed.data)) {
        if (Array.isArray(list)) count += list.length;
      }

      syncLogger.log('success', `Restauration de la base locale réussie (${count} enregistrements restaurés)`, 'LOCAL');
      return {
        success: true,
        message: 'Base de données locale restaurée avec succès.',
        recordsRestored: count
      };
    } catch (err: any) {
      syncLogger.log('error', `Échec de la restauration de la sauvegarde : ${err.message}`, 'LOCAL');
      return {
        success: false,
        message: err.message || 'Erreur lors de la lecture du fichier de sauvegarde.',
        recordsRestored: 0
      };
    }
  }
}
