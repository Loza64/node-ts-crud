import { FindOptionsWhere, ILike, IsNull, Not } from 'typeorm';

/**
 * Convierte el texto de busqueda en un patron ILIKE '%texto%' escapando los
 * comodines de LIKE (% _ \) para que el usuario los busque de forma literal.
 */
export const toLikePattern = (search: string): string =>
  `%${search.replace(/[\\%_]/g, '\\$&')}%`;

export const iLikeContains = (search: string) => ILike(toLikePattern(search));

/**
 * Condicion de `deletedAt` segun el filtro de estado. Combinar SIEMPRE con
 * `withDeleted: status !== 'active'` en las opciones de find.
 */
export const deletedAtCondition = (status: 'active' | 'deleted' | 'all') =>
  (status === 'deleted' ? { deletedAt: Not(IsNull()) } : {}) as FindOptionsWhere<{
    deletedAt: Date | null;
  }>;
