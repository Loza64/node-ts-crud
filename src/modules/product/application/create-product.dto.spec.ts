/// <reference types="jest" />

import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateProductDto } from './create-product.dto';

const check = (body: unknown) =>
  validate(plainToInstance(CreateProductDto, body), { whitelist: true, forbidNonWhitelisted: true });

describe('CreateProductDto', () => {
  it('accepts the { category: { id }, photos: [{ id }] } contract', async () => {
    const errors = await check({
      name: 'Camisa',
      description: 'Algodón',
      price: 19.99,
      in_stock: true,
      category: { id: 1 },
      photos: [{ id: 1 }, { id: 3 }],
    });

    expect(errors).toHaveLength(0);
  });

  it('accepts a body without description, in_stock and photos', async () => {
    expect(await check({ name: 'Camisa', price: 10, category: { id: 2 } })).toHaveLength(0);
  });

  it.each([
    ['category missing', { name: 'Camisa', price: 10 }],
    ['category as plain number (old contract)', { name: 'Camisa', price: 10, category: 1 }],
    ['category id not positive', { name: 'Camisa', price: 10, category: { id: 0 } }],
    ['extra property inside category', { name: 'Camisa', price: 10, category: { id: 1, name: 'x' } }],
    ['photos as plain numbers (old contract)', { name: 'Camisa', price: 10, category: { id: 1 }, photos: [1, 2] }],
    ['photo id invalid', { name: 'Camisa', price: 10, category: { id: 1 }, photos: [{ id: 'abc' }] }],
    ['repeated photo ids', { name: 'Camisa', price: 10, category: { id: 1 }, photos: [{ id: 2 }, { id: 2 }] }],
    ['price with 3 decimals', { name: 'Camisa', price: 1.234, category: { id: 1 } }],
  ])('rejects: %s', async (_label, body) => {
    expect((await check(body)).length).toBeGreaterThan(0);
  });
});
