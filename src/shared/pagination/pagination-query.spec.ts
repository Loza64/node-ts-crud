import express from 'express';
import request from 'supertest';
import { validateQuery } from '../middlewares/validate-query.middleware';
import { ProductQueryDto } from '../../modules/product/application/product-query.dto';
import { SoftDeleteQueryDto } from './pagination-query.dto';
import { swaggerSpec } from '../../swagger';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const createQueryApp = (dto: typeof ProductQueryDto | typeof SoftDeleteQueryDto) => {
  const app = express();
  app.get('/', validateQuery(dto), (req, res) => res.status(200).json(req.validatedQuery));
  return app;
};

const getQueryParameters = (path: string): Record<string, unknown>[] => {
  const document: unknown = swaggerSpec;
  if (!isRecord(document) || !isRecord(document.paths)) return [];

  const pathItem = document.paths[path];
  if (!isRecord(pathItem) || !isRecord(pathItem.get)) return [];

  const parameters = pathItem.get.parameters;
  return Array.isArray(parameters) ? parameters.filter(isRecord) : [];
};

describe('pagination query contracts', () => {
  it('accepts the documented product query parameter names and converts their values', async () => {
    const response = await request(createQueryApp(ProductQueryDto)).get(
      '/?page=1&pageSize=10&deleted=false&category=2',
    );

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      page: 1,
      pageSize: 10,
      deleted: false,
      category: 2,
    });
  });

  it('rejects the obsolete delete parameter and invalid boolean values', async () => {
    const app = createQueryApp(SoftDeleteQueryDto);

    const obsoleteParameter = await request(app).get('/?delete=false');
    const invalidBoolean = await request(app).get('/?deleted=maybe');

    expect(obsoleteParameter.status).toBe(400);
    expect(invalidBoolean.status).toBe(400);
  });

  it('documents exactly the query fields accepted by each list endpoint', () => {
    const productParameters = getQueryParameters('/api/products');
    const categoryParameters = getQueryParameters('/api/categories');
    const photoParameters = getQueryParameters('/api/photos');

    const names = (parameters: Record<string, unknown>[]) =>
      parameters
        .filter((parameter) => parameter.in === 'query')
        .map((parameter) => parameter.name)
        .sort();

    expect(names(productParameters)).toEqual(['category', 'deleted', 'page', 'pageSize', 'search']);
    expect(names(categoryParameters)).toEqual(['deleted', 'page', 'pageSize', 'search']);
    expect(names(photoParameters)).toEqual(['page', 'pageSize', 'search']);
  });
});
