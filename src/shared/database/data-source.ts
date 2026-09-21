import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from '../config/env';
import { Category } from '../../modules/category/domain/category.entity';
import { Product } from '../../modules/product/domain/product.entity';
import { Photo } from '../../modules/photo/domain/photo.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  synchronize: env.isDev,
  logging: env.isDev,
  entities: [Category, Product, Photo],
  migrations: ['dist/shared/database/migrations/*.js'],
});
