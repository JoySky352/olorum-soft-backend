import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsEnum, IsNumberString, IsOptional } from 'class-validator';

export class GetSalesDto {
  @ApiPropertyOptional({
    description: 'Status',
    enum: ['created', 'charged', 'refunded'],
  })
  @IsOptional()
  @IsEnum(['created', 'charged', 'refunded'])
  status?: 'created' | 'charged' | 'refunded';

  @ApiPropertyOptional({ description: 'Fecha inicio' })
  @IsOptional()
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ description: 'Fecha fin' })
  @IsOptional()
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Cantidad de elementos a retornar' })
  @IsOptional()
  @IsNumberString()
  limit?: number;

  @ApiPropertyOptional({ description: 'Cantidad de elementos a omitir' })
  @IsOptional()
  @IsNumberString()
  offset?: number;
}
