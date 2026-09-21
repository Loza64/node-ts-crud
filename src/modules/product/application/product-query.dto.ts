import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';
import { SoftDeleteQueryDto } from '../../../shared/pagination/pagination-query.dto';

/** ?page&pageSize&search&status(active|deleted|all)&category=<id> */
export class ProductQueryDto extends SoftDeleteQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  category?: number;
}
