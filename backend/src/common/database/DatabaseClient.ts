import { Pool, QueryResult } from 'pg';
import { config } from '@/config';

class DatabaseClient {
  private pool: Pool;
  private keepAliveTimer: NodeJS.Timeout | null = null;

  constructor() {
    const isLocal = config.DATABASE_URL.includes('localhost') || config.DATABASE_URL.includes('127.0.0.1');

    this.pool = new Pool({
      connectionString: config.DATABASE_URL,
      max: 10,
      min: 2,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 6000,
      // Enable TCP KeepAlive to prevent silent connection drop by cloud NAT firewalls (Render <-> Supabase)
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      ssl: isLocal ? false : { rejectUnauthorized: false }
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client:', err.message);
    });

    // Start background DB keepalive to avoid idle socket drops and Supabase spin-down
    this.startKeepAlive();
  }

  private startKeepAlive(): void {
    if (this.keepAliveTimer) return;
    // Ping every 4 minutes (Supabase / Render NAT drops idle sockets after 5 min)
    this.keepAliveTimer = setInterval(
      async () => {
        try {
          await this.pool.query('SELECT 1');
        } catch (err: any) {
          console.warn('[DatabaseClient] Keep-alive ping failed, pool will reconnect on demand:', err?.message);
        }
      },
      4 * 60 * 1000
    );

    // Don't keep Node process alive solely for keepalive timer on exit
    if (this.keepAliveTimer.unref) {
      this.keepAliveTimer.unref();
    }
  }

  public async warmup(): Promise<void> {
    try {
      const start = Date.now();
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log(`[DatabaseClient] Connection pool pre-warmed successfully in ${Date.now() - start}ms`);
    } catch (err: any) {
      console.warn('[DatabaseClient] Pre-warm failed, will retry on first request:', err?.message);
    }
  }

  public async query(text: string, params?: any[]): Promise<QueryResult> {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      // Only log queries taking > 150ms in production to avoid logging overhead
      if (duration > 150 || config.NODE_ENV === 'development') {
        console.log(`[DatabaseClient] Executed query (${duration}ms):`, {
          text: text.slice(0, 80).trim().replace(/\s+/g, ' '),
          duration,
          rows: res.rowCount
        });
      }
      return res;
    } catch (error) {
      console.error('Error executing query', { text: text.slice(0, 100), error });
      throw error;
    }
  }

  public async getClient() {
    return await this.pool.connect();
  }

  public async close(): Promise<void> {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
    await this.pool.end();
  }
}

export const db = new DatabaseClient();
