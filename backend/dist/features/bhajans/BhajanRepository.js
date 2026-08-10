"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bhajanRepository = exports.BhajanRepository = void 0;
const DatabaseClient_1 = require("@common/database/DatabaseClient");
class BhajanRepository {
    tableName = 'bhajans';
    async getList(params) {
        const { page, limit, search, status, category, primaryDeity, sort } = params;
        const offset = (page - 1) * limit;
        const queryParams = [];
        let whereClauses = ['b.deleted_at IS NULL', 'b.youtube_video_id IS NULL'];
        if (status) {
            queryParams.push(status);
            whereClauses.push(`b.status = $${queryParams.length}`);
        }
        if (category) {
            queryParams.push(category);
            whereClauses.push(`b.category_id = $${queryParams.length}`);
        }
        if (primaryDeity) {
            queryParams.push(primaryDeity);
            whereClauses.push(`b.god_id = $${queryParams.length}`);
        }
        if (search) {
            queryParams.push(`%${search}%`);
            whereClauses.push(`(b.title ILIKE $${queryParams.length} OR b.slug ILIKE $${queryParams.length} OR b.lyrics ILIKE $${queryParams.length})`);
        }
        const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        let orderByStr = 'ORDER BY b.created_at DESC';
        if (sort === 'newest')
            orderByStr = 'ORDER BY b.created_at DESC';
        else if (sort === 'oldest')
            orderByStr = 'ORDER BY b.created_at ASC';
        else if (sort === 'alphabetical')
            orderByStr = 'ORDER BY b.title ASC';
        else if (sort === 'views')
            orderByStr = 'ORDER BY b.views DESC';
        const countQuery = `
      SELECT COUNT(*) as total FROM ${this.tableName} b
      ${whereStr}
    `;
        const dataQuery = `
      SELECT b.id, b.title, b.slug, b.status, b.views, b.created_at, b.category_id, b.god_id,
             c.name as "categoryName", g.name as "deityName"
      FROM ${this.tableName} b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN gods g ON b.god_id = g.id
      ${whereStr}
      ${orderByStr}
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
        const [countResult, dataResult] = await Promise.all([
            DatabaseClient_1.db.query(countQuery, queryParams),
            DatabaseClient_1.db.query(dataQuery, [...queryParams, limit, offset])
        ]);
        const count = parseInt(countResult.rows[0].total, 10);
        const data = dataResult.rows.map(row => ({
            ...row,
            categories: row.categoryName ? { name: row.categoryName } : null,
            gods: row.deityName ? { name: row.deityName } : null
        }));
        return { data, count };
    }
    async getByIdWithRelations(id) {
        const dataQuery = `
      SELECT b.*, 
             c.id as "categoryId", c.name as "categoryName",
             g.id as "deityId", g.name as "deityName"
      FROM ${this.tableName} b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN gods g ON b.god_id = g.id
      WHERE b.id = $1 AND b.deleted_at IS NULL
    `;
        const dataResult = await DatabaseClient_1.db.query(dataQuery, [id]);
        if (dataResult.rowCount === 0)
            return null;
        const bhajan = dataResult.rows[0];
        const additionalGodsQuery = `SELECT god_id FROM bhajan_gods WHERE bhajan_id = $1`;
        const additionalGodsResult = await DatabaseClient_1.db.query(additionalGodsQuery, [id]);
        return {
            ...bhajan,
            categories: bhajan.categoryId ? { id: bhajan.categoryId, name: bhajan.categoryName } : null,
            gods: bhajan.deityId ? { id: bhajan.deityId, name: bhajan.deityName } : null,
            bhajan_gods: additionalGodsResult.rows
        };
    }
    async updateAdditionalDeities(bhajanId, deityIds) {
        // Delete existing
        await DatabaseClient_1.db.query(`DELETE FROM bhajan_gods WHERE bhajan_id = $1`, [bhajanId]);
        // Insert new
        if (deityIds && deityIds.length > 0) {
            const values = deityIds.map((id, i) => `($1, $${i + 2})`).join(', ');
            await DatabaseClient_1.db.query(`INSERT INTO bhajan_gods (bhajan_id, god_id) VALUES ${values}`, [bhajanId, ...deityIds]);
        }
    }
    async softDelete(id) {
        await DatabaseClient_1.db.query(`UPDATE ${this.tableName} SET deleted_at = NOW() WHERE id = $1`, [id]);
    }
    async bulkAction(ids, action) {
        if (!ids.length)
            return;
        const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
        if (action === 'DELETE') {
            await DatabaseClient_1.db.query(`UPDATE ${this.tableName} SET deleted_at = NOW() WHERE id IN (${placeholders})`, ids);
        }
        else {
            let status = 'DRAFT';
            if (action === 'PUBLISH')
                status = 'PUBLISHED';
            if (action === 'ARCHIVE')
                status = 'ARCHIVED';
            await DatabaseClient_1.db.query(`UPDATE ${this.tableName} SET status = $${ids.length + 1} WHERE id IN (${placeholders})`, [...ids, status]);
        }
    }
    async create(data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const query = `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
        const res = await DatabaseClient_1.db.query(query, values);
        return res.rows[0];
    }
    async update(id, data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
        const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;
        const res = await DatabaseClient_1.db.query(query, [...values, id]);
        return res.rows[0];
    }
}
exports.BhajanRepository = BhajanRepository;
exports.bhajanRepository = new BhajanRepository();
