"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediaRepository = exports.MediaRepository = void 0;
const DatabaseClient_1 = require("../common/database/DatabaseClient");
class MediaRepository {
    foldersTable = 'media_folders';
    filesTable = 'media_files';
    mapFolderToModel(row) {
        return {
            id: row.id,
            name: row.name,
            parentId: row.parent_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
    mapFileToModel(row) {
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
    async createFolder(dto) {
        const query = `INSERT INTO ${this.foldersTable} (name, parent_id) VALUES ($1, $2) RETURNING *`;
        const { rows } = await DatabaseClient_1.db.query(query, [dto.name, dto.parentId || null]);
        return this.mapFolderToModel(rows[0]);
    }
    async getFolders(parentId) {
        let query = `SELECT * FROM ${this.foldersTable}`;
        const params = [];
        if (parentId) {
            query += ` WHERE parent_id = $1`;
            params.push(parentId);
        }
        else {
            query += ` WHERE parent_id IS NULL`;
        }
        query += ` ORDER BY name ASC`;
        const { rows } = await DatabaseClient_1.db.query(query, params);
        return rows.map(r => this.mapFolderToModel(r));
    }
    async updateFolder(id, name) {
        const query = `UPDATE ${this.foldersTable} SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *`;
        const { rows } = await DatabaseClient_1.db.query(query, [name, id]);
        return this.mapFolderToModel(rows[0]);
    }
    async deleteFolder(id) {
        await DatabaseClient_1.db.query(`DELETE FROM ${this.foldersTable} WHERE id = $1`, [id]);
    }
    // Files
    async createFile(dto) {
        const query = `
      INSERT INTO ${this.filesTable} 
      (file_name, original_name, folder_id, mime_type, size_bytes, url, thumbnail_url, dimensions, storage_path)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
        const params = [
            dto.fileName,
            dto.originalName,
            dto.folderId || null,
            dto.mimeType,
            dto.sizeBytes,
            dto.url,
            dto.thumbnailUrl,
            dto.dimensions,
            dto.storagePath
        ];
        const { rows } = await DatabaseClient_1.db.query(query, params);
        return this.mapFileToModel(rows[0]);
    }
    async getFiles(folderId, search) {
        let query = `SELECT * FROM ${this.filesTable}`;
        const params = [];
        if (search) {
            query += ` WHERE file_name ILIKE $1`;
            params.push(`%${search}%`);
        }
        else {
            if (folderId) {
                query += ` WHERE folder_id = $1`;
                params.push(folderId);
            }
            else {
                query += ` WHERE folder_id IS NULL`;
            }
        }
        query += ` ORDER BY created_at DESC`;
        const { rows } = await DatabaseClient_1.db.query(query, params);
        return rows.map(r => this.mapFileToModel(r));
    }
    async getFile(id) {
        const { rows } = await DatabaseClient_1.db.query(`SELECT * FROM ${this.filesTable} WHERE id = $1 LIMIT 1`, [id]);
        if (rows.length === 0)
            return null;
        return this.mapFileToModel(rows[0]);
    }
    async updateFile(id, dto) {
        const updates = ['updated_at = NOW()'];
        const params = [];
        let paramIdx = 1;
        if (dto.fileName !== undefined) {
            updates.push(`file_name = $${paramIdx++}`);
            params.push(dto.fileName);
        }
        if (dto.folderId !== undefined) {
            updates.push(`folder_id = $${paramIdx++}`);
            params.push(dto.folderId || null);
        }
        params.push(id);
        const query = `UPDATE ${this.filesTable} SET ${updates.join(', ')} WHERE id = $${paramIdx} RETURNING *`;
        const { rows } = await DatabaseClient_1.db.query(query, params);
        return this.mapFileToModel(rows[0]);
    }
    async deleteFile(id) {
        await DatabaseClient_1.db.query(`DELETE FROM ${this.filesTable} WHERE id = $1`, [id]);
    }
}
exports.MediaRepository = MediaRepository;
exports.mediaRepository = new MediaRepository();
