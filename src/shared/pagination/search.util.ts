import { FindOptionsWhere, ILike, IsNull, Not } from 'typeorm';

export const toLikePattern = (search: string): string =>
  `%${search.replace(/[\\%_]/g, '\\$&')}%`;

export const iLikeContains = (search: string) => ILike(toLikePattern(search));

export const deletedAtCondition = (deleted: boolean) =>
  (deleted ? { deletedAt: Not(IsNull()) } : {}) as FindOptionsWhere<{
    deletedAt: Date | null;
  }>;
