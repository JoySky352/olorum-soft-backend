import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDate, IsEnum, IsNumberString, IsOptional, IsNumber } from "class-validator";
import { Type } from "class-transformer";

export class GetSalesDto {
  @ApiPropertyOptional({
    description: "Status",
    enum: ["created", "charged", "refunded", "partial_refund", "pending"], // 👈 agregar "pending"
  })
  @IsOptional()
  @IsEnum(["created", "charged", "refunded", "partial_refund", "pending"])
  status?: "created" | "charged" | "refunded" | "partial_refund" | "pending";

  @ApiPropertyOptional({ description: "Fecha inicio" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ description: "Fecha fin" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({ description: "ID del turno" })
  @IsOptional()
  @IsNumber()
  shiftId?: number;

  @ApiPropertyOptional({ description: "Cantidad de elementos a retornar" })
  @IsOptional()
  @IsNumberString()
  limit?: number;

  @ApiPropertyOptional({ description: "Cantidad de elementos a omitir" })
  @IsOptional()
  @IsNumberString()
  offset?: number;
}