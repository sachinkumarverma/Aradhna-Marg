import { supabase } from '../database/supabase';
import { MediaFolder, MediaFile, CreateMediaFolderDTO, CreateMediaFileDTO, UpdateMediaFileDTO } from '../models/Media';

export class MediaRepository {
  private readonly foldersTable = 'media_folders';
  private readonly filesTable = 'media_files';

  private mapFolderToModel(row: any): MediaFolder {
    return {
      id: row.id,
      name: row.name,
      parentId: row.parent_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapFileToModel(row: any): MediaFile {
    return {
      id: row.id,
      fileName: row.file_name,
      originalName: row.original_name,
      folderId: row.folder_id,
      mimeType: row.mime_type,
      sizeBytes: row.size_bytes,
      url: row.url,
      thumbnailUrl: row.thumbnail_url,
      dimensions: row.dimensions,
      storagePath: row.storage_path,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // Folders
  async createFolder(dto: CreateMediaFolderDTO): Promise<MediaFolder> {
    const { data, error } = await supabase
      .from(this.foldersTable)
      .insert([{
        name: dto.name,
        parent_id: dto.parentId || null,
      }])
      .select()
      .single();

    if (error) throw error;
    return this.mapFolderToModel(data);
  }

  async getFolders(parentId?: string | null): Promise<MediaFolder[]> {
    let query = supabase.from(this.foldersTable).select('*');
    if (parentId) {
      query = query.eq('parent_id', parentId);
    } else {
      query = query.is('parent_id', null);
    }

    const { data, error } = await query.order('name');
    if (error) throw error;
    return data.map(this.mapFolderToModel);
  }

  async updateFolder(id: string, name: string): Promise<MediaFolder> {
    const { data, error } = await supabase
      .from(this.foldersTable)
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapFolderToModel(data);
  }

  async deleteFolder(id: string): Promise<void> {
    const { error } = await supabase.from(this.foldersTable).delete().eq('id', id);
    if (error) throw error;
  }

  // Files
  async createFile(dto: CreateMediaFileDTO): Promise<MediaFile> {
    const { data, error } = await supabase
      .from(this.filesTable)
      .insert([{
        file_name: dto.fileName,
        original_name: dto.originalName,
        folder_id: dto.folderId || null,
        mime_type: dto.mimeType,
        size_bytes: dto.sizeBytes,
        url: dto.url,
        thumbnail_url: dto.thumbnailUrl,
        dimensions: dto.dimensions,
        storage_path: dto.storagePath,
      }])
      .select()
      .single();

    if (error) throw error;
    return this.mapFileToModel(data);
  }

  async getFiles(folderId?: string | null, search?: string): Promise<MediaFile[]> {
    let query = supabase.from(this.filesTable).select('*');
    
    if (search) {
      query = query.ilike('file_name', `%${search}%`);
    } else {
      if (folderId) {
        query = query.eq('folder_id', folderId);
      } else {
        query = query.is('folder_id', null);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(this.mapFileToModel);
  }

  async getFile(id: string): Promise<MediaFile | null> {
    const { data, error } = await supabase.from(this.filesTable).select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;
    return this.mapFileToModel(data);
  }

  async updateFile(id: string, dto: UpdateMediaFileDTO): Promise<MediaFile> {
    const updates: any = { updated_at: new Date().toISOString() };
    if (dto.fileName !== undefined) updates.file_name = dto.fileName;
    if (dto.folderId !== undefined) updates.folder_id = dto.folderId || null;

    const { data, error } = await supabase
      .from(this.filesTable)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapFileToModel(data);
  }

  async deleteFile(id: string): Promise<void> {
    const { error } = await supabase.from(this.filesTable).delete().eq('id', id);
    if (error) throw error;
  }
}

export const mediaRepository = new MediaRepository();
