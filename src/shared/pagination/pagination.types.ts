/**
 * Estado de borrado por el que se filtra un listado:
 *  - active:  solo los NO eliminados (default)
 *  - deleted: solo los eliminados (papelera)
 *  - all:     ambos
 */
export type DeletedStatus = 'active' | 'deleted' | 'all';

export const DELETED_STATUSES: readonly DeletedStatus[] = ['active', 'deleted', 'all'];

export interface PageMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

/**
 * Resultado paginado que devuelven los repositorios (agnostico de la lib de
 * paginacion: lo que sale de nestjs-typeorm-paginate ya viene con este meta).
 */
export interface Page<T> {
  items: T[];
  meta: PageMeta;
}

/** Parametros comunes de todos los listados. */
export interface ListParams {
  page: number;
  pageSize: number;
  search?: string;
}

/** Parametros de listado para entidades con soft delete. */
export interface SoftDeleteListParams extends ListParams {
  status: DeletedStatus;
}
