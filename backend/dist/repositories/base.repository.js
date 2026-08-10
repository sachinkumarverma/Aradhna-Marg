"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
const DatabaseClient_1 = require("@common/database/DatabaseClient");
class BaseRepository {
    tableName;
    constructor(tableName) {
        this.tableName = tableName;
    }
    async findAll(options) {
        const selectStr = options?.select || '*';
        let query = `SELECT ${selectStr} FROM ${this.tableName} WHERE deleted_at IS NULL`;
        if (options?.order) {
            const orderDir = options.order.ascending ?? true ? 'ASC' : 'DESC';
            query += ` ORDER BY ${options.order.column} ${orderDir}`;
        }
        const { rows } = await DatabaseClient_1.db.query(query);
        return rows;
    }
    async findById(id) {
        const { rows } = await DatabaseClient_1.db.query(`SELECT * FROM ${this.tableName} WHERE id = $1 AND deleted_at IS NULL LIMIT 1`, [id]);
        return rows[0] || null;
    }
    async findBySlug(slug) {
        const { rows } = await DatabaseClient_1.db.query(`SELECT * FROM ${this.tableName} WHERE slug = $1 AND deleted_at IS NULL LIMIT 1`, [slug]);
        return rows[0] || null;
    }
    async create(data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const query = `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
        const { rows } = await DatabaseClient_1.db.query(query, values);
        return rows[0];
    }
    async update(id, data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
        values.push(id); // ID is the last parameter
        const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = $${values.length} RETURNING *`;
        const { rows } = await DatabaseClient_1.db.query(query, values);
        return rows[0];
    }
    async delete(id) {
        await DatabaseClient_1.db.query(`DELETE FROM ${this.tableName} WHERE id = $1`, [id]);
        return true;
    }
    async paginate(page, limit, filters) {
        const offset = (page - 1) * limit;
        let whereClauses = ['deleted_at IS NULL'];
        const params = [];
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    whereClauses.push(`${key} = $${params.length + 1}`);
                    params.push(value);
                }
            });
        }
        const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        const dataQuery = `SELECT * FROM ${this.tableName} ${whereStr} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereStr}`;
        const [dataResult, countResult] = await Promise.all([
            DatabaseClient_1.db.query(dataQuery, [...params, limit, offset]),
            DatabaseClient_1.db.query(countQuery, params)
        ]);
        return {
            data: dataResult.rows || [],
            total: parseInt(countResult.rows[0].total, 10) || 0,
            page,
            limit,
        };
    }
    async search(queryText, options) {
        const selectStr = options?.select || '*';
        const limit = options?.limit || 20;
        // Very basic fallback since full text search requires specific columns.
        const query = `
      SELECT ${selectStr} FROM ${this.tableName} 
      WHERE deleted_at IS NULL AND (
        title ILIKE $1 OR description ILIKE $1
      )
      LIMIT $2
    `;
        const { rows } = await DatabaseClient_1.db.query(query, [`%${queryText}%`, limit]);
        return rows;
    }
}
exports.BaseRepository = BaseRepository;
