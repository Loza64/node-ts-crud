/// <reference types="jest" />

import request from 'supertest';
import { createApp } from './app';

describe('app', () => {
  const app = createApp();

  it('GET /api/health/hello returns 200 and greeting', async () => {
    const res = await request(app).get('/api/health/hello');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'hello server' });
  });

  it('POST /api/products rejects a body without category', async () => {
    const res = await request(app).post('/api/products').send({ name: 'Camisa', price: 10 });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('category');
  });

  it('POST /api/products rejects invalid nested category/photos with a readable message', async () => {
    const res = await request(app).post('/api/products').send({ name: 'Camisa', price: 10, category: 5, photos: [{ id: 'x' }] });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('category');
    expect(res.body.message).toContain('photos.0.id');
  });

  it('POST /api/products rejects repeated photo ids', async () => {
    const res = await request(app).post('/api/products').send({ name: 'Camisa', price: 10, category: { id: 1 }, photos: [{ id: 3 }, { id: 3 }] });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('photos');
  });

  it('GET /api/products rejects an unknown status filter', async () => {
    const res = await request(app).get('/api/products?status=borrados');

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('status');
  });

  it('GET /api/categories rejects a pageSize above the limit', async () => {
    const res = await request(app).get('/api/categories?pageSize=1000');

    expect(res.status).toBe(400);
  });

  it('PATCH /api/products/abc/restore rejects an invalid id', async () => {
    const res = await request(app).patch('/api/products/abc/restore');

    expect(res.status).toBe(400);
  });
});
