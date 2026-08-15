import { randomUUID } from 'crypto';
import { puranRepository } from '@repositories/PuranRepository';
import { backblazeStorageService } from '@services/storage/BackblazeStorageService';
import { slugify } from '@utils/slugify';
export class PuranService {
  public async getList(query: any) {
    return puranRepository.getList({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
      search: query.search,
      status: query.status,
      language: query.language,
      sort: query.sort
    });
  }

  public async getById(id: string) {
    return puranRepository.getById(id);
  }

  public async create(data: any) {
    if (!data.slug && data.title) {
      data.slug = randomUUID();
    }
    return puranRepository.create(data);
  }

  public async update(id: string, data: any) {
    if (data.title && !data.slug) {
      data.slug = randomUUID();
    }

    let oldPdf = null;
    if (data.pdf_file) {
      const existing = await puranRepository.getById(id);
      if (
        existing &&
        existing.pdf_file &&
        existing.pdf_file !== data.pdf_file &&
        existing.pdf_file.startsWith('puranas/')
      ) {
        oldPdf = existing.pdf_file;
      }
    }

    const updated = await puranRepository.update(id, data);

    if (oldPdf) {
      try {
        await backblazeStorageService.deletePdf(oldPdf);
      } catch (err) {
        console.error('Failed to delete old Puran PDF from B2:', err);
      }
    }
    return updated;
  }

  public async delete(id: string) {
    const existing = await puranRepository.getById(id);
    const deleted = await puranRepository.update(id, { deleted_at: new Date().toISOString() });

    // Soft delete preserves the file natively, but if the architecture requires it, we'd delete it here.
    // Following existing soft delete behavior by not wiping B2 files immediately.

    return deleted;
  }

  public async bulkAction(ids: string[], action: string) {
    return puranRepository.bulkAction(ids, action);
  }

  public async getBySlug(slug: string) {
    const data = await puranRepository.getBySlug(slug);
    if (!data) throw new Error('Purana not found');
    const related = await puranRepository.getRelated(data.id, data.language || '');
    return { ...data, related };
  }

  public async incrementView(id: string) {
    return puranRepository.incrementStats(id, 'view_count');
  }

  public async incrementDownload(id: string) {
    return puranRepository.incrementStats(id, 'download_count');
  }

  public async uploadPdf(fileBuffer: Buffer, mimeType: string, originalName: string) {
    const cleanName = slugify(originalName.replace(/\.[^/.]+$/, '')) + '.pdf';
    const storageKey = `puranas/uploads/${Date.now()}-${cleanName}`;

    await backblazeStorageService.uploadPdf(fileBuffer, storageKey, mimeType);
    return storageKey;
  }

  public async getPdfUrl(id: string) {
    const puran = await puranRepository.getById(id);
    if (!puran || !puran.pdf_file) throw new Error('PDF not found');

    if (puran.pdf_file.startsWith('http')) {
      return puran.pdf_file;
    }

    return backblazeStorageService.getSignedUrl(puran.pdf_file);
  }
}

export const puranService = new PuranService();
