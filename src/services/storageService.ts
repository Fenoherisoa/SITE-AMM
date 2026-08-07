import { StorageService } from '../types';

/**
 * StorageService abstraction layer.
 * Designed to seamlessly interface with Google Drive / Cloud Storage in future phases.
 * Currently provides standard local object URL generation and metadata registry.
 */
class LocalStorageAdapter implements StorageService {
  private fileRegistry: Map<string, { url: string; name: string; type: string; uploadedAt: string }> = new Map();

  async uploadFile(file: File, folder: string = 'general'): Promise<{ url: string; fileId: string }> {
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const objectUrl = URL.createObjectURL(file);
    
    this.fileRegistry.set(fileId, {
      url: objectUrl,
      name: file.name,
      type: file.type,
      uploadedAt: new Date().toISOString()
    });

    console.log(`[StorageService] Uploaded file "${file.name}" to folder "${folder}" with ID: ${fileId}`);
    return { url: objectUrl, fileId };
  }

  async getFileUrl(fileId: string): Promise<string> {
    const fileData = this.fileRegistry.get(fileId);
    if (!fileData) {
      throw new Error(`[StorageService] File with ID "${fileId}" not found.`);
    }
    return fileData.url;
  }

  async deleteFile(fileId: string): Promise<boolean> {
    const fileData = this.fileRegistry.get(fileId);
    if (fileData) {
      URL.revokeObjectURL(fileData.url);
      this.fileRegistry.delete(fileId);
      console.log(`[StorageService] Deleted file with ID: ${fileId}`);
      return true;
    }
    return false;
  }
}

export const storageService: StorageService = new LocalStorageAdapter();
