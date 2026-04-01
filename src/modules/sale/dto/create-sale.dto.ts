import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CreateSaleItemDto } from "./create-sale-item.dto";
import { IsArray, IsNotEmpty, IsString, IsOptional, IsNumber } from "class-validator";
import { Type } from "class-transformer";

export class CreateSaleDto {
  @ApiProperty({ isArray: true, type: CreateSaleItemDto })
  @IsArray({ each: true })
  @IsNotEmpty()
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];

  @ApiProperty()
  @IsString()
  paymentMethod: string;

  @ApiPropertyOptional({ description: "ID del usuario que realiza la venta" })
  @IsOptional()
  @IsNumber()
  userId?: number;
}