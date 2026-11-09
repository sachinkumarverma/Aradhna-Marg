import fs from 'fs';
import path from 'path';
import { db } from '@common/database/DatabaseClient';
import { aiJobService } from '@admin/services/AiJobService';
import { agentRunRepository } from '@/agents/repositories/AgentRunRepository';
import { logger } from '@utils/logger';
import { config } from '@/config';
import { cronManager } from '@/cron/manager';

export interface SystemHealthOverview {
  database: {
    status: 'HEALTHY' | 'ERROR';
    latencyMs: number;
    error?: string;
  };
  aiQueue: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    today: number;
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  };
  agentExecution: {
    totalRuns: number;
    recentFailedRuns: number;
    status: 'HEALTHY' | 'WARNING';
  };
  process: {
    uptimeSeconds: number;
    memoryUsageMb: number;
    nodeVersion: string;
    environment: string;
  };
  timestamp: string;
}

export interface SystemHealthDiagnostics {
  api_status: 'OK' | 'ERROR';
  database_status: 'OK' | 'ERROR';
  database_latency_ms: number;
  storage_status: 'OK' | 'NOT_CONFIGURED';
  youtube_api_status: 'OK' | 'NOT_CONFIGURED';
  groq_ai_status: 'OK' | 'NOT_CONFIGURED' | 'NOT_SELECTED';
  cron_jobs_status: 'OK' | 'ERROR';
  server_time: string;
  uptime_seconds: number;
  environment: 'Production' | 'Development' | 'Test';
  version: {
    frontend: string;
    backend: string;
    database: string;
  };
  diagnostics: SystemHealthOverview;
  cron_jobs: ReturnType<typeof cronManager.getHealthSummary>;
}

const readPackageVersion = (packagePath: string): string => {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as { version?: string };
    return packageJson.version ?? 'unknown';
  } catch {
    return 'unknown';
  }
};

const readLatestMigration = (migrationsPath: string): string => {
  try {
    const migrations = fs
      .readdirSync(migrationsPath)
      .filter((file) => file.endsWith('.sql'))
      .sort();
    return migrations.at(-1)?.replace(/\.sql$/, '') ?? 'unknown';
  } catch {
    return 'unknown';
  }
};

export class SystemHealthService {
  public async getHealthOverview(): Promise<SystemHealthOverview> {
    const timestamp = new Date().toISOString();

    // 1. Database check
    let dbStatus: 'HEALTHY' | 'ERROR' = 'HEALTHY';
    let dbLatencyMs: number;
    let dbError: string | undefined;

    const dbStart = Date.now();
    try {
      await db.query('SELECT 1');
      dbLatencyMs = Date.now() - dbStart;
    } catch (err: any) {
      dbStatus = 'ERROR';
      dbLatencyMs = Date.now() - dbStart;
      dbError = err.message || 'Database connection error';
      logger.error({ err }, 'Database health check failed in SystemHealthService');
    }

    // 2. AI Job Queue check
    let aiQueue = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      today: 0,
      status: 'HEALTHY' as 'HEALTHY' | 'WARNING' | 'CRITICAL'
    };

    try {
      const stats = await aiJobService.getStats();
      const failed = stats.failed || 0;
      const pending = stats.pending || 0;

      let queueStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
      if (failed > 10 || pending > 100) {
        queueStatus = 'CRITICAL';
      } else if (failed > 0 || pending > 20) {
        queueStatus = 'WARNING';
      }

      aiQueue = {
        pending,
        processing: stats.processing || 0,
        completed: stats.completed || 0,
        failed,
        today: stats.today || 0,
        status: queueStatus
      };
    } catch (err) {
      logger.warn({ err }, 'Failed to fetch AI job stats in SystemHealthService');
    }

    // 3. Agent Execution health
    let agentExecution = {
      totalRuns: 0,
      recentFailedRuns: 0,
      status: 'HEALTHY' as 'HEALTHY' | 'WARNING'
    };

    try {
      const recentRuns = await agentRunRepository.list(1, 20);
      const failedRuns = recentRuns.data.filter((r) => r.status === 'FAILED');
      agentExecution = {
        totalRuns: recentRuns.count,
        recentFailedRuns: failedRuns.length,
        status: failedRuns.length > 3 ? 'WARNING' : 'HEALTHY'
      };
    } catch (err) {
      logger.warn({ err }, 'Failed to check agent runs in SystemHealthService');
    }

    // 4. Node Process & Runtime info
    const mem = process.memoryUsage();
    const memoryUsageMb = Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100;

    return {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        error: dbError
      },
      aiQueue,
      agentExecution,
      process: {
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMb,
        nodeVersion: process.version,
        environment:
          config.NODE_ENV === 'production' ? 'Production' : config.NODE_ENV === 'test' ? 'Test' : 'Development'
      },
      timestamp
    };
  }

  public async getDetailedHealth(): Promise<SystemHealthDiagnostics> {
    const diagnostics = await this.getHealthOverview();
    const safeDiagnostics: SystemHealthOverview = {
      ...diagnostics,
      database: {
        status: diagnostics.database.status,
        latencyMs: diagnostics.database.latencyMs
      }
    };
    const cronJobs = cronManager.getHealthSummary();
    const databaseHealthy = diagnostics.database.status === 'HEALTHY';
    const environment =
      config.NODE_ENV === 'production' ? 'Production' : config.NODE_ENV === 'test' ? 'Test' : 'Development';
    const selectedAiConfigured = config.AI_PROVIDER === 'groq' && Boolean(config.GROQ_API_KEY);

    return {
      api_status: databaseHealthy ? 'OK' : 'ERROR',
      database_status: databaseHealthy ? 'OK' : 'ERROR',
      database_latency_ms: diagnostics.database.latencyMs,
      storage_status:
        process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)
          ? 'OK'
          : 'NOT_CONFIGURED',
      youtube_api_status: config.YOUTUBE_API_KEY ? 'OK' : 'NOT_CONFIGURED',
      groq_ai_status: config.AI_PROVIDER !== 'groq' ? 'NOT_SELECTED' : selectedAiConfigured ? 'OK' : 'NOT_CONFIGURED',
      cron_jobs_status: cronJobs.status,
      server_time: safeDiagnostics.timestamp,
      uptime_seconds: safeDiagnostics.process.uptimeSeconds,
      environment,
      version: {
        backend: readPackageVersion(path.resolve(__dirname, '../../package.json')),
        frontend: readPackageVersion(path.resolve(__dirname, '../../../frontend/package.json')),
        database: readLatestMigration(path.resolve(__dirname, '../../supabase/migrations'))
      },
      diagnostics: safeDiagnostics,
      cron_jobs: cronJobs
    };
  }
}

export const systemHealthService = new SystemHealthService();
