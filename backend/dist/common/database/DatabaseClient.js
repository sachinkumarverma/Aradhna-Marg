"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const pg_1 = require("pg");
const config_1 = require("../../config");
class DatabaseClient {
    pool;
    constructor() {
        this.pool = new pg_1.Pool({
            connectionString: config_1.config.DATABASE_URL,
        });
    }
    async query(text, params) {
        const start = Date.now();
        try {
            const res = await this.pool.query(text, params);
            const duration = Date.now() - start;
            console.log('Executed query', { text, duration, rows: res.rowCount });
            return res;
        }
        catch (error) {
            console.error('Error executing query', { text, error });
            throw error;
        }
    }
    async getClient() {
        return await this.pool.connect();
    }
}
exports.db = new DatabaseClient();
