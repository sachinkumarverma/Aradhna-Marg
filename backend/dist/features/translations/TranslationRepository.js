"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translationRepository = exports.TranslationRepository = void 0;
const DatabaseClient_1 = require("@common/database/DatabaseClient");
class TranslationRepository {
    mapToModel(row) {
        return {
            id: row.id,
            contentType: row.content_type,
            contentId: row.content_id,
            sourceLanguage: row.source_language,
            targetLanguage: row.target_language,
            title: row.title,
            excerpt: row.excerpt,
            description: row.description,
            content: row.content,
            festivalDetails: row.festival_details,
            seoTitle: row.seo_title,
            seoDescription: row.seo_description,
            provider: row.provider,
            translationStatus: row.translation_status,
            sourceVersion: row.source_version,
            translatedAt: row.translated_at,
            reviewedAt: row.reviewed_at,
            approvedAt: row.approved_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
    async getTranslation(contentType, contentId, targetLanguage) {
        const query = `
      SELECT * FROM content_translations 
      WHERE content_type = $1 AND content_id = $2 AND target_language = $3
      LIMIT 1
    `;
        const result = await DatabaseClient_1.db.query(query, [contentType, contentId, targetLanguage]);
        return result.rows.length ? this.mapToModel(result.rows[0]) : null;
    }
    async upsertTranslation(dto) {
        const query = `
      INSERT INTO content_translations (
        content_type, content_id, source_language, target_language,
        title, excerpt, description, content, festival_details, seo_title, seo_description,
        provider, translation_status, source_version, translated_at
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8, $9, $10, $11,
        $12, $13, $14, NOW()
      )
      ON CONFLICT (content_type, content_id, target_language) DO UPDATE SET
        title = EXCLUDED.title,
        excerpt = EXCLUDED.excerpt,
        description = EXCLUDED.description,
        content = EXCLUDED.content,
        festival_details = EXCLUDED.festival_details,
        seo_title = EXCLUDED.seo_title,
        seo_description = EXCLUDED.seo_description,
        provider = EXCLUDED.provider,
        translation_status = EXCLUDED.translation_status,
        source_version = EXCLUDED.source_version,
        translated_at = NOW()
      RETURNING *;
    `;
        const params = [
            dto.contentType, dto.contentId, dto.sourceLanguage, dto.targetLanguage,
            dto.title, dto.excerpt, dto.description, dto.content, dto.festivalDetails, dto.seoTitle, dto.seoDescription,
            dto.provider, dto.translationStatus, dto.sourceVersion
        ];
        const result = await DatabaseClient_1.db.query(query, params);
        return this.mapToModel(result.rows[0]);
    }
    async updateTranslationStatus(id, updates) {
        const setClauses = [];
        const params = [];
        let paramIndex = 1;
        if (updates.title !== undefined) {
            setClauses.push(`title = $${paramIndex++}`);
            params.push(updates.title);
        }
        if (updates.excerpt !== undefined) {
            setClauses.push(`excerpt = $${paramIndex++}`);
            params.push(updates.excerpt);
        }
        if (updates.description !== undefined) {
            setClauses.push(`description = $${paramIndex++}`);
            params.push(updates.description);
        }
        if (updates.content !== undefined) {
            setClauses.push(`content = $${paramIndex++}`);
            params.push(updates.content);
        }
        if (updates.festivalDetails !== undefined) {
            setClauses.push(`festival_details = $${paramIndex++}`);
            params.push(updates.festivalDetails);
        }
        if (updates.seoTitle !== undefined) {
            setClauses.push(`seo_title = $${paramIndex++}`);
            params.push(updates.seoTitle);
        }
        if (updates.seoDescription !== undefined) {
            setClauses.push(`seo_description = $${paramIndex++}`);
            params.push(updates.seoDescription);
        }
        if (updates.translationStatus !== undefined) {
            setClauses.push(`translation_status = $${paramIndex++}`);
            params.push(updates.translationStatus);
            if (updates.translationStatus === 'APPROVED') {
                setClauses.push(`approved_at = NOW()`);
            }
            else if (updates.translationStatus === 'NEEDS_REVIEW') {
                setClauses.push(`reviewed_at = NOW()`);
            }
        }
        if (setClauses.length === 0)
            throw new Error('No fields to update');
        params.push(id);
        const query = `
      UPDATE content_translations
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *;
    `;
        const result = await DatabaseClient_1.db.query(query, params);
        return this.mapToModel(result.rows[0]);
    }
}
exports.TranslationRepository = TranslationRepository;
exports.translationRepository = new TranslationRepository();
