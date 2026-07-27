"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.articleRepository = exports.ArticleRepository = void 0;
const base_repository_1 = require("./base.repository");
class ArticleRepository extends base_repository_1.BaseRepository {
    constructor() {
        super('articles');
    }
    async getList(params) {
        const { page, limit, search, status, category, author, featured, festival, deity, sort } = params;
        const offset = (page - 1) * limit;
        let query = this.db.from(this.tableName)
            .select('id, title, slug, status, featured, view_count, created_at, publish_date, category_id, categories(name), author_id, authors(name), featured_image_id, media_files(url)', { count: 'exact' })
            .is('deleted_at', null);
        if (status)
            query = query.eq('status', status);
        if (category)
            query = query.eq('category_id', category);
        if (author)
            query = query.eq('author_id', author);
        if (featured === 'true')
            query = query.eq('featured', true);
        if (featured === 'false')
            query = query.eq('featured', false);
        // Note: complex joins for festival/deity filtering in list might need a raw query or inner select
        // Assuming simple filtering for now, or skipping if too complex for Supabase standard client
        if (search) {
            query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
        }
        if (sort === 'newest')
            query = query.order('created_at', { ascending: false });
        else if (sort === 'oldest')
            query = query.order('created_at', { ascending: true });
        else if (sort === 'views')
            query = query.order('view_count', { ascending: false });
        else
            query = query.order('created_at', { ascending: false });
        const { data, count, error } = await query.range(offset, offset + limit - 1);
        if (error)
            throw error;
        return { data, count };
    }
    async getByIdWithRelations(id) {
        const { data, error } = await this.db.from(this.tableName)
            .select(`
        *,
        categories(id, name),
        authors(id, name),
        media_files(id, url, file_name),
        article_gods(god_id),
        article_festivals(festival_id),
        article_tags(tag_id),
        article_bhajans(bhajan_id),
        related_articles(related_id)
      `)
            .eq('id', id)
            .is('deleted_at', null)
            .single();
        if (error)
            throw error;
        return data;
    }
    async updateJunctionTable(tableName, articleId, foreignColumn, ids) {
        await this.db.from(tableName).delete().eq('article_id', articleId);
        if (ids && ids.length > 0) {
            const inserts = ids.map(id => ({ article_id: articleId, [foreignColumn]: id }));
            const { error } = await this.db.from(tableName).insert(inserts);
            if (error)
                throw error;
        }
    }
    async bulkAction(ids, action) {
        if (action === 'DELETE') {
            const { error } = await this.db.from(this.tableName)
                .update({ deleted_at: new Date().toISOString() })
                .in('id', ids);
            if (error)
                throw error;
        }
        else if (action === 'FEATURE' || action === 'UNFEATURE') {
            const featured = action === 'FEATURE';
            const { error } = await this.db.from(this.tableName).update({ featured }).in('id', ids);
            if (error)
                throw error;
        }
        else {
            let status = 'DRAFT';
            if (action === 'PUBLISH')
                status = 'PUBLISHED';
            if (action === 'ARCHIVE')
                status = 'ARCHIVED';
            const { error } = await this.db.from(this.tableName).update({ status }).in('id', ids);
            if (error)
                throw error;
        }
    }
}
exports.ArticleRepository = ArticleRepository;
exports.articleRepository = new ArticleRepository();
