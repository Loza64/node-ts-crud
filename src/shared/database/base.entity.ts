import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  id: number = 0;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date = new Date();

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date = new Date();
}

export abstract class SoftDeletableEntity extends BaseEntity {
  @DeleteDateColumn({ type: 'timestamptz', nullable: true, default: null })
  deletedAt: Date | null = null;
}
