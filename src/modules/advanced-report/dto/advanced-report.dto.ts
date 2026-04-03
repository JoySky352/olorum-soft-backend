import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDate, IsOptional, IsNumber } from "class-validator";
import { Type } from "class-transformer";

export class GetAdvancedReportDto {
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
}

export class DashboardStatsDto {
  totalVentas: number;
  ingresosTotales: number;
  gananciaTotal: number;
  totalGastos: number;
  gananciaNeta: number;
  ticketPromedio: number;
  productosVendidos: number;
  clientesAtendidos: number;
}

export class TopProductDto {
  productId: number;
  productName: string;
  quantitySold: number;
  totalRevenue: number;
  stock: number;
  unitPrice: number;
}

export class LowStockProductDto {
  productId: number;
  productName: string;
  stock: number;
  unitPrice: number;
  category: string;
}

export class SalesByHourDto {
  hour: number;
  total: number;
  quantity: number;
}

export class DailySalesDto {
  date: string;
  total: number;
  quantity: number;
  ganancia: number;
}

export class PaymentMethodReportDto {
  method: string;
  total: number;
  percentage: number;
  count: number;
}

export class CategorySalesDto {
  category: string;
  total: number;
  percentage: number;
  quantity: number;
}

export class ProviderSalesDto {
  provider: string;
  total: number;
  quantity: number;
  ganancia: number;
}

export class UserPerformanceDto {
  userId: number;
  userName: string;
  totalVentas: number;
  ingresosTotales: number;
  gananciaTotal: number;
  ticketPromedio: number;
}

export class AdvancedReportResponseDto {
  periodo: { startDate: string; endDate: string };
  dashboard: DashboardStatsDto;
  topProducts: TopProductDto[];
  lowStockProducts: LowStockProductDto[];
  salesByHour: SalesByHourDto[];
  dailySales: DailySalesDto[];
  paymentMethods: PaymentMethodReportDto[];
  salesByCategory: CategorySalesDto[];
  salesByProvider: ProviderSalesDto[];
  userPerformance: UserPerformanceDto[];
}PaymentMethodReportDto