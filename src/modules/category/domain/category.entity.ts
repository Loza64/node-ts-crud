import { Column, Entity, OneToMany } from 'typeorm';
import { SoftDeletableEntity } from '../../../shared/database/base.entity';
import { Product } from '../../product/domain/product.entity';

@Entity('categories')
export class Category extends SoftDeletableEntity {
  @Column({ type: 'varchar', length: 120 })
  name: string = '';

  @Column({ type: 'text', nullable: true })
  description: string | null = null;

  @OneToMany(() => Product, (product) => product.category)
  products?: Product[];

  toPublic() {
    return {
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      name: this.name,
      description: this.description,
      id: this.id,
    };
  }
}
