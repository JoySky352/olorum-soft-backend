import { ApiProperty } from "@nestjs/swagger";

export class SalesByDateDto {
    @ApiProperty()
    date: string;
    @ApiProperty()
    total: number;
    @ApiProperty()
    quantity: number;
}

export class SalesByUserDto {
    @ApiProperty()
    userId: number;
    @ApiProperty()
    username: string;
    @ApiProperty()
    totalVentas: number;
    @ApiProperty()
    ingresosTotales: number;
    @ApiProperty()
    gananciaTotal: number;
}

export class SalesByPaymentMethodDto {
    @ApiProperty()
    paymentMethod: string;
    @ApiProperty()
    totalVentas: number;
    @ApiProperty()
    montoTotal: number;
}

export class TopProductsDto {
    @ApiProperty()
    productId: number;
    @ApiProperty()
    productName: string;
    @ApiProperty()
    quantitySold: number;
    @ApiProperty()
    totalRevenue: number;
}

export class SalesByProviderDto {
    @ApiProperty()
    provider: string;
    @ApiProperty()
    totalVentas: number;
    @ApiProperty()
    montoTotal: number;
    @ApiProperty()
    gananciaTotal: number;
}

export class SalesByCategoryDto {
    @ApiProperty()
    category: string;
    @ApiProperty()
    totalVentas: number;
    @ApiProperty()
    montoTotal: number;
}

export class DailySalesSummaryDto {
    @ApiProperty()
    date: string;
    @ApiProperty()
    totalVentas: number;
    @ApiProperty()
    ingresosTotales: number;
    @ApiProperty()
    gananciaTotal: number;
    @ApiProperty({ type: [SalesByPaymentMethodDto] })
    porMetodoPago: SalesByPaymentMethodDto[];
}

export class CompleteReportDto {
    @ApiProperty()
    periodo: { startDate: string; endDate: string };
    @ApiProperty()
    resumenGeneral: {
        totalVentas: number;
        ingresosTotales: number;
        gananciaTotal: number;
        totalProductosVendidos: number;
        promedioPorVenta: number;
    };
    @ApiProperty({ type: [SalesByDateDto] })
    ventasPorDia: SalesByDateDto[];
    @ApiProperty({ type: [SalesByUserDto] })
    ventasPorUsuario: SalesByUserDto[];
    @ApiProperty({ type: [SalesByPaymentMethodDto] })
    ventasPorMetodoPago: SalesByPaymentMethodDto[];
    @ApiProperty({ type: [TopProductsDto] })
    productosMasVendidos: TopProductsDto[];
    @ApiProperty({ type: [SalesByProviderDto] })
    ventasPorProveedor: SalesByProviderDto[];
    @ApiProperty({ type: [SalesByCategoryDto] })
    ventasPorCategoria: SalesByCategoryDto[];
}