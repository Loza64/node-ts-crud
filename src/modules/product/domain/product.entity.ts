import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne } from 'typeorm';
import { SoftDeletableEntity } from '../../../shared/database/base.entity';
import { Category } from '../../category/domain/category.entity';
import { Photo } from '../../photo/domain/photo.entity';

@Entity('products')
export class Product extends SoftDeletableEntity {
  @Column({ type: 'varchar', length: 150 })
  name: string = '';

  @Column({ type: 'text', nullable: true })
  description: string | null = null;

  // decimal: TypeORM/pg lo devuelve como string ("17348943.40")
  @Column({ type: 'decimal', precision: 14, scale: 2 })
  price: string = '0';

  // nombre en snake_case a proposito, para respetar el contrato pedido
  @Column({ type: 'boolean', default: true, name: 'in_stock' })
  in_stock: boolean = true;

  @ManyToOne(() => Category, (category) => category.products, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'categoryId' })
  category!: Category;

  // Sin onDelete propio: la tabla intermedia usa ON DELETE CASCADE, asi que al
  // eliminar una foto (permanente) se desasocia automaticamente de sus productos.
  @ManyToMany(() => Photo)
  @JoinTable({
    name: 'product_photos',
    joinColumn: { name: 'productId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'photoId', referencedColumnName: 'id' },
  })
  photos!: Photo[];

  toPublic() {
    return {
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      name: this.name,
      description: this.description,
      price: this.price,
      in_stock: this.in_stock,
      category: this.category ? this.category.toPublic() : null,
      photos: (this.photos ?? []).map((photo) => photo.toPublic()),
      id: this.id,
    };
  }
}
