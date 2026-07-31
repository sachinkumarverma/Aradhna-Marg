import { Pool, QueryResult } from 'pg';
import { config } from '../../config';

class DatabaseClient {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: config.DATABASE_URL,
    });
  }

  public async query(text: string, params?: any[]): Promise<QueryResult> {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error('Error executing query', { text, error });
      throw error;
    }
  }

  public async getClient() {
    return await this.pool.connect();
  }
}

export const db = new DatabaseClient();
