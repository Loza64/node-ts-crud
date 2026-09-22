import { ObjectLiteral, Repository, FindManyOptions, FindOptionsWhere } from 'typeorm';
import { paginate } from 'nestjs-typeorm-paginate';
import { Page, PageMeta } from './pagination.types';

export const paginateRepository = <T extends ObjectLiteral>(
  repository: Repository<T>,
  { page, pageSize }: { page: number; pageSize: number },
  options: FindOptionsWhere<T> | FindManyOptions<T>,
): Promise<Page<T>> =>
  paginate<T, PageMeta>(
    repository,
    {
      page,
      limit: pageSize,
      metaTransformer: (meta): PageMeta => ({
        page: meta.currentPage,
        pageSize: meta.itemsPerPage,
        pageCount: meta.totalPages ?? 0,
        total: meta.totalItems ?? 0,
      }),
    },
    options,
  );

export interface PaginatedResult<T> {
  data: T[];
  pagination: PageMeta;
}

export const buildPaginatedResponse = <T, R>(
  { items, meta }: Page<T>,
  mapper: (item: T) => R,
): PaginatedResult<R> => ({
  data: items.map(mapper),
  pagination: meta,
});
