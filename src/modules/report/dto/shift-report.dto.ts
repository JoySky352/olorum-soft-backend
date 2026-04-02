import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDate, IsOptional, IsNumber, IsString, IsEnum } from "class-validator";
import { Type } from "class-transformer";

export class GetShiftReportDto {
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

    @ApiPropertyOptional({ description: "ID del usuario" })
    @IsOptional()
    @IsNumber()
    userId?: number;

    @ApiPropertyOptional({ description: "Estado del turno" })
    @IsOptional()
    @IsEnum(['open', 'closed'])
    status?: 'open' | 'closed';
}

export class ShiftReportSummaryDto {
    @ApiProperty()
    totalVentas: number;
    @ApiProperty()
    ingresosTotales: number;
    @ApiProperty()
    gananciaTotal: number;
    @ApiProperty()
    totalProductosVendidos: number;
    @ApiProperty()
    promedioPorVenta: number;
    @ApiProperty()
    ventasPorMetodoPago: {
        efectivo: number;
        transferencia: number;
        free: number;
        freeCosto: number;
    };
    @ApiProperty()
    ventasPorProveedor: {
        proveedor: string;
        totalVentas: number;
        montoTotal: number;
        gananciaTotal: number;
    }[];
    @ApiProperty()
    ventasPorUsuario: {
        userId: number;
        userName: string;
        totalVentas: number;
        ingresosTotales: number;
        gananciaTotal: number;
    }[];
}

export class ShiftReportResponseDto {
    @ApiProperty()
    periodo: {
        startDate: string;
        endDate: string;
        turnosIncluidos: number;
    };
    @ApiProperty()
    resumen: ShiftReportSummaryDto;
    @ApiProperty()
    turnos: {
        id: number;
        userName: string;
        openedAt: string;
        closedAt: string | null;
        totalVentas: number;
        ingresosTotales: number;
        gananciaTotal: number;
    }[];
}