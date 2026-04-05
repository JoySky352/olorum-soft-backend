import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsDate, Min } from "class-validator";
import { Type } from "class-transformer";

export class OpenShiftDto {
    @ApiPropertyOptional({ description: "Efectivo inicial en caja", default: 0 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    openingCash?: number;
}

export class CloseShiftDto {
    @ApiProperty()
    @IsNumber()
    @Min(0)
    closingCash: number;
}

export class GetShiftsDto {
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
    userId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    limit?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    offset?: number;
}

export class ShiftReportDto {
    @ApiProperty()
    id: number;
    @ApiProperty()
    userName: string;
    @ApiProperty()
    openedAt: string;
    @ApiProperty()
    closedAt: string | null;
    @ApiProperty()
    openingCash: number;
    @ApiProperty()
    closingCash: number | null;
    @ApiProperty()
    status: string;
    @ApiProperty()
    totalVentas: number;
    @ApiProperty()
    ingresosTotales: number;
    @ApiProperty()
    gananciaTotal: number;
    @ApiProperty()
    ventasPorMetodoPago: {
        efectivo: number;
        transferencia: number;
        mixto: number;
        free: number;
    };
    @ApiProperty()
    salario: number;
}