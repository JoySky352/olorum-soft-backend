import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDate, IsOptional, IsEnum, IsString, IsNumber } from "class-validator";
import { Type } from "class-transformer";

export class GetNewReportsDto {
    @ApiPropertyOptional({ description: "Fecha inicio (formato YYYY-MM-DD)" })
    @IsOptional()
    @Type(() => Date)
    startDate?: Date;

    @ApiPropertyOptional({ description: "Fecha fin (formato YYYY-MM-DD)" })
    @IsOptional()
    @Type(() => Date)
    endDate?: Date;

    @ApiPropertyOptional({ description: "ID del usuario" })
    @IsOptional()
    @IsNumber()
    userId?: number;

    @ApiPropertyOptional({ description: "Método de pago" })
    @IsOptional()
    @IsString()
    paymentMethod?: string;

    @ApiPropertyOptional({ description: "Proveedor" })
    @IsOptional()
    @IsString()
    provider?: string;

    @ApiPropertyOptional({ description: "Categoría de producto" })
    @IsOptional()
    @IsString()
    category?: string;

    @ApiPropertyOptional({ description: "Estado de venta" })
    @IsOptional()
    @IsEnum(['charged', 'created', 'refunded'])
    status?: 'charged' | 'created' | 'refunded';
}