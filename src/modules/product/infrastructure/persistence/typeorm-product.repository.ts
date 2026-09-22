import { FindOptionsWhere, Repository } from 'typeorm';
import { AppDataSource } from '../../../../shared/database/data-source';
import { paginateRepository } from '../../../../shared/pagination/paginate.util';
import { Page } from '../../../../shared/pagination/pagination.types';
import { deletedAtCondition, iLikeContains } from '../../../../shared/pagination/search.util';
import { Product } from '../../domain/product.entity';
import { ProductFindAllParams, ProductRepository } from '../../domain/product.repository';

const BASE_SELECT = {
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  name: true,
  description: true,
  price: true,
  in_stock: true,
  category: {
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    name: true,
    description: true,
  },
  photos: {
    id: true,
    url: true,
    secureUrl: true,
    resourceType: true,
    format: true,
    originalFilename: true,
    width: true,
    height: true,
    bytes: true,
    tags: true,
    eager: true,
  },
} as const;

const RELATIONS = { category: true, photos: true } as const;

export class TypeOrmProductRepository implements ProductRepository {
  private readonly repo: Repository<Product> = AppDataSource.getRepository(Product);

  findAll({
    page,
    pageSize,
    search,
    status,
    categoryId,
  }: ProductFindAllParams): Promise<Page<Product>> {
    const base: FindOptionsWhere<Product> = {
      ...deletedAtCondition(status),
      ...(categoryId ? { category: { id: categoryId } } : {}),
    };

    const where: FindOptionsWhere<Product>[] = search
      ? [
          { ...base, name: iLikeContains(search) },
          { ...base, description: iLikeContains(search) },
        ]
      : [base];

    return paginateRepository(
      this.repo,
      { page, pageSize },
      {
        where,
        relations: RELATIONS,
        select: BASE_SELECT,
        order: { id: 'DESC' },
        withDeleted: status !== 'active',
      },
    );
  }

  findById(id: number, withDeleted = false): Promise<Product | null> {
    return this.repo.findOne({
      where: { id },
      relations: RELATIONS,
      select: BASE_SELECT,
      withDeleted,
    });
  }

  existsByCategory(categoryId: number): Promise<boolean> {
    return this.repo.exists({ where: { category: { id: categoryId } } });
  }

  save(product: Product): Promise<Product> {
    return this.repo.save(product);
  }

  async softDelete(id: number): Promise<void> {
    await this.repo.softDelete(id);
  }

  async restore(id: number): Promise<void> {
    await this.repo.restore(id);
  }
}
