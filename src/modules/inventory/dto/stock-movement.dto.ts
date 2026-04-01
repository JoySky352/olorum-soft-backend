import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, IsDate, Min } from "class-validator";
import { Type } from "class-transformer";

export class CreateStockMovementDto {
  @ApiProperty()
  @IsNumber()
  productId: number;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  quantityAdded: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  newUnitCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  newUnitPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class GetStockMovementsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  productId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  offset?: number;
}