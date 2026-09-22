import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { IdRefDto } from '../../../shared/dto/id-ref.dto';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price?: number;

  @IsOptional()
  @IsBoolean()
  in_stock?: boolean;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => IdRefDto)
  category?: IdRefDto;

  @IsOptional()
  @IsArray()
  @ArrayUnique((photo: IdRefDto) => photo?.id, { message: 'photos no puede contener ids repetidos' })
  @ValidateNested({ each: true })
  @Type(() => IdRefDto)
  photos?: IdRefDto[];
}
