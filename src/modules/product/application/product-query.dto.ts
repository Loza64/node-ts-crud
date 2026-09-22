import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';
import { SoftDeleteQueryDto } from '../../../shared/pagination/pagination-query.dto';

export class ProductQueryDto extends SoftDeleteQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  category?: number;
}
