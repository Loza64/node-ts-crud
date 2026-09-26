import { FindOptionsWhere, Repository } from 'typeorm';
import { AppDataSource } from '../../../../shared/database/data-source';
import { paginateRepository } from '../../../../shared/pagination/paginate.util';
import { Page, SoftDeleteListParams } from '../../../../shared/pagination/pagination.types';
import { deletedAtCondition, iLikeContains } from '../../../../shared/pagination/search.util';
import { Category } from '../../domain/category.entity';
import { CategoryRepository } from '../../domain/category.repository';

const BASE_SELECT = {
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  name: true,
  description: true,
} as const;

export class TypeOrmCategoryRepository implements CategoryRepository {
  private readonly repo: Repository<Category> = AppDataSource.getRepository(Category);

  findAll({ page, pageSize, search, deleted }: SoftDeleteListParams): Promise<Page<Category>> {
    const base: FindOptionsWhere<Category> = { ...deletedAtCondition(deleted) };

    const where: FindOptionsWhere<Category>[] = search
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
        select: BASE_SELECT,
        order: { id: 'DESC' },
        withDeleted: deleted,
      },
    );
  }

  findById(id: number, withDeleted = false): Promise<Category | null> {
    return this.repo.findOne({ where: { id }, select: BASE_SELECT, withDeleted });
  }

  save(category: Category): Promise<Category> {
    return this.repo.save(category);
  }

  async softDelete(id: number): Promise<void> {
    await this.repo.softDelete(id);
  }

  async restore(id: number): Promise<void> {
    await this.repo.restore(id);
  }
}
