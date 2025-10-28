import {
  IsOptional,
  IsString,
  IsNumberString,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetProductsDto {
  @ApiPropertyOptional({ description: 'Filtrar por nombre del producto' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Filtrar por categoría' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filtrar por proveedor' })
  @IsOptional()
  @IsString()
  investor?: string;

  @ApiPropertyOptional({ description: 'Omitir items sin stock' })
  @IsOptional()
  @IsBoolean()
  skipEmpty?: boolean;

  @ApiPropertyOptional({ description: 'Cantidad de elementos a retornar' })
  @IsOptional()
  @IsNumberString()
  limit?: number;

  @ApiPropertyOptional({ description: 'Cantidad de elementos a omitir' })
  @IsOptional()
  @IsNumberString()
  offset?: number;
}
