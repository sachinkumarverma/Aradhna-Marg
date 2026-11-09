process.env.NODE_ENV = 'test';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import http from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { db } from '../common/database/DatabaseClient';
import healthRoutes, { internalHealthRoutes } from '../routes/health';
import { globalErrorHandler } from '../middlewares/error';
import { systemHealthService, SystemHealthOverview } from '../services/SystemHealthService';

describe('Health endpoint security', () => {
  let server: http.Server;
  let baseUrl: string;
  const originalQuery = db.query;
  const originalDetailedHealth = systemHealthService.getDetailedHealth;
  const originalHealthOverview = systemHealthService.getHealthOverview;

  before(async () => {
    db.query = async () => ({ rows: [], rowCount: 1 }) as any;
    const testApp = express();
    testApp.use('/api/health', healthRoutes);
    testApp.use('/health', healthRoutes);
    testApp.use('/api/internal/health', internalHealthRoutes);
    testApp.use(globalErrorHandler);

    await new Promise<void>((resolve) => {
      server = testApp.listen(0, () => {
        const address = server.address() as { port: number };
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    db.query = originalQuery;
    systemHealthService.getDetailedHealth = originalDetailedHealth;
    systemHealthService.getHealthOverview = originalHealthOverview;
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await db.close();
  });

  it('returns the minimal public response without diagnostics', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, {
      success: true,
      message: 'Service is healthy',
      status: 'OK'
    });
  });

  it('returns a generic 503 when the public basic check fails', async () => {
    db.query = async () => {
      throw new Error('database connection details must not be exposed');
    };

    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();

    assert.equal(response.status, 503);
    assert.deepEqual(body, {
      success: false,
      message: 'Service unavailable',
      status: 'ERROR'
    });

    db.query = async () => ({ rows: [], rowCount: 1 }) as any;
  });

  it('builds internal diagnostics from runtime health data without exposing database errors', async () => {
    const overview: SystemHealthOverview = {
      database: { status: 'ERROR', latencyMs: 15, error: 'secret connection detail' },
      aiQueue: { pending: 0, processing: 0, completed: 0, failed: 0, today: 0, status: 'HEALTHY' },
      agentExecution: { totalRuns: 0, recentFailedRuns: 0, status: 'HEALTHY' },
      process: {
        uptimeSeconds: 1,
        memoryUsageMb: 10,
        nodeVersion: 'v22',
        environment: 'Development'
      },
      timestamp: '2026-11-09T00:00:00.000Z'
    };
    systemHealthService.getHealthOverview = async () => overview;

    try {
      const diagnostics = await originalDetailedHealth.call(systemHealthService);
      assert.equal(diagnostics.api_status, 'ERROR');
      assert.equal(diagnostics.diagnostics.database.error, undefined);
      assert.equal(diagnostics.version.backend, '1.0.0');
      assert.notEqual(diagnostics.version.database, 'unknown');
    } finally {
      systemHealthService.getHealthOverview = originalHealthOverview;
    }
  });

  it('rejects unauthenticated internal health requests with 401', async () => {
    const response = await fetch(`${baseUrl}/api/internal/health`);
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.data, undefined);
    assert.equal(body.database_status, undefined);
    assert.equal(body.stack, undefined);
  });

  it('rejects authenticated non-admin users with 403', async () => {
    const userToken = jwt.sign({ id: 'user-1', role: 'user' }, config.JWT_SECRET, { expiresIn: '1h' });
    const response = await fetch(`${baseUrl}/api/internal/health`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const body = await response.json();

    assert.equal(response.status, 403);
    assert.equal(body.data, undefined);
    assert.equal(body.database_status, undefined);
  });

  it('returns detailed diagnostics only to an admin without secrets', async () => {
    const adminToken = jwt.sign({ username: config.ADMIN_USERNAME, role: 'admin' }, config.JWT_SECRET, {
      expiresIn: '1h'
    });
    const diagnostics = {
      api_status: 'OK' as const,
      database_status: 'OK' as const,
      database_latency_ms: 2,
      storage_status: 'OK' as const,
      youtube_api_status: 'OK' as const,
      groq_ai_status: 'OK' as const,
      cron_jobs_status: 'OK' as const,
      server_time: '2026-11-09T00:00:00.000Z',
      uptime_seconds: 10,
      environment: 'Test' as const,
      version: { frontend: '0.0.0', backend: '1.0.0', database: 'latest-migration' },
      diagnostics: {
        database: { status: 'HEALTHY' as const, latencyMs: 2 },
        aiQueue: { pending: 0, processing: 0, completed: 1, failed: 0, today: 1, status: 'HEALTHY' as const },
        agentExecution: { totalRuns: 1, recentFailedRuns: 0, status: 'HEALTHY' as const },
        process: { uptimeSeconds: 10, memoryUsageMb: 20, nodeVersion: 'v22', environment: 'Test' },
        timestamp: '2026-11-09T00:00:00.000Z'
      },
      cron_jobs: { status: 'OK' as const, jobs: [] }
    };

    systemHealthService.getDetailedHealth = async () => diagnostics;

    const response = await fetch(`${baseUrl}/api/internal/health`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.data.database_status, 'OK');
    assert.equal(JSON.stringify(body).includes(config.JWT_SECRET), false);
    assert.equal(JSON.stringify(body).includes(config.ADMIN_PASSWORD), false);
  });

  it('returns a generic 503 when detailed diagnostics fail', async () => {
    const adminToken = jwt.sign({ username: config.ADMIN_USERNAME, role: 'admin' }, config.JWT_SECRET, {
      expiresIn: '1h'
    });
    systemHealthService.getDetailedHealth = async () => {
      throw new Error('internal database details must not be exposed');
    };

    const response = await fetch(`${baseUrl}/api/internal/health`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const body = await response.json();

    assert.equal(response.status, 503);
    assert.deepEqual(body, {
      success: false,
      message: 'Health diagnostics unavailable',
      status: 'ERROR'
    });
  });
});
