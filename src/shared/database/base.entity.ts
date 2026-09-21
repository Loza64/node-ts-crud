import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

/**
 * Base para entidades que se eliminan de forma PERMANENTE (ej. Photo).
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  id: number = 0;

  // OJO: no usar `select: false` aqui. Con eso TypeORM no carga estas columnas
  // al hacer save(), cree que "cambiaron" y las escribe de vuelta con el valor
  // viejo, por lo que updatedAt nunca se actualizaba al editar.
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date = new Date();

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date = new Date();
}

/**
 * Base para entidades con borrado logico (soft delete) y restore
 * (ej. Product, Category).
 */
export abstract class SoftDeletableEntity extends BaseEntity {
  @DeleteDateColumn({ type: 'timestamptz', nullable: true, default: null })
  deletedAt: Date | null = null;
}
