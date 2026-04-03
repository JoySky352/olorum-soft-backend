import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CreateSaleItemDto } from "./create-sale-item.dto";
import { IsArray, IsNotEmpty, IsString, IsOptional, IsNumber, ValidateNested, IsObject } from "class-validator";
import { Type } from "class-transformer";

export class MixedPaymentDto {
  @ApiProperty({ example: 100.00 })
  @IsNumber()
  efectivo: number;

  @ApiProperty({ example: 50.00 })
  @IsNumber()
  transferencia: number;
}

export class USDPaymentDto {
  @ApiProperty({ example: 1.00 })
  @IsNumber()
  usdAmount: number;

  @ApiProperty({ example: 320.00 })
  @IsNumber()
  exchangeRate: number;

  @ApiPropertyOptional({ example: 320.00 })
  @IsOptional()
  @IsNumber()
  cupAmount?: number;

  @ApiPropertyOptional({ example: 2.00 })
  @IsOptional()
  @IsNumber()
  usdReceived?: number;

  @ApiPropertyOptional({ example: 320.00 })
  @IsOptional()
  @IsNumber()
  changeInCUP?: number;
}

export class CreateSaleDto {
  @ApiProperty({ isArray: true, type: CreateSaleItemDto })
  @IsArray({ each: true })
  @IsNotEmpty()
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];

  @ApiProperty({ example: "Efectivo", enum: ["Efectivo", "Transferencia", "Free", "USD", "Mixto"] })
  @IsString()
  paymentMethod: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => MixedPaymentDto)
  mixedPayment?: MixedPaymentDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => USDPaymentDto)
  usdPayment?: USDPaymentDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  userId?: number;
}