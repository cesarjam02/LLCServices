import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';

describe('API', () => {
  const app = createApp();

  it('responde al health check', async () => {
    const response = await request(app).get('/api/v1/health');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'ok' });
  });

  it('devuelve 404 estructurado para rutas desconocidas', async () => {
    const response = await request(app).get('/no-existe');
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ success: false });
  });

  it('protege las rutas administrativas', async () => {
    const response = await request(app).get('/api/v1/admin/dashboard/summary');
    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ success: false });
  });
});
