import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';

/**
 * Referencia a otra entidad por id: { "id": 1 }.
 * Se usa para category: { id } y photos: [{ id }, { id }].
 */
export class IdRefDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id!: number;
}
