import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Sale } from "../../sale/entities/sale.entity";
import { SaleItem } from "../../sale/entities/sale-item.entity";
import { Product } from "../../inventory/entities/product.entity";
import { Shift } from "../../shift/entities/shift.entity";
import { Expense } from "../../expense/entities/expense.entity";
import { CashWithdrawal } from "../../expense/entities/cash-withdrawal.entity";
import { GetAdvancedReportDto, AdvancedReportResponseDto, DashboardStatsDto, TopProductDto, LowStockProductDto, SalesByHourDto, DailySalesDto, PaymentMethodReportDto, CategorySalesDto, ProviderSalesDto, UserPerformanceDto } from "../dto/advanced-report.dto";

@Injectable()
export class AdvancedReportService {
    constructor(
        @InjectRepository(Sale)
        private saleRepository: Repository<Sale>,
        @InjectRepository(SaleItem)
        private saleItemRepository: Repository<SaleItem>,
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
        @InjectRepository(Shift)
        private shiftRepository: Repository<Shift>,
        @InjectRepository(Expense)
        private expenseRepository: Repository<Expense>,
        @InjectRepository(CashWithdrawal)
        private withdrawalRepository: Repository<CashWithdrawal>,
    ) { }

    async getAdvancedReport(dto: GetAdvancedReportDto): Promise<AdvancedReportResponseDto> {
        const { startDate, endDate, userId } = dto;

        console.log('=== ADVANCED REPORT ===');
        console.log('Filtros recibidos en backend:', { startDate, endDate, userId });

        // Definir rango de fechas
        let start: Date;
        let end: Date;

        if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
        } else {
            start = new Date(new Date().setDate(1));
            end = new Date();
        }

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        // Obtener turnos en el rango
        const shifts = await this.shiftRepository
            .createQueryBuilder("shift")
            .where("shift.opened_at BETWEEN :start AND :end", { start, end })
            .getMany();

        const shiftIds = shifts.map(s => s.id);

        // Obtener ventas de los turnos
        const salesQuery = this.saleRepository
            .createQueryBuilder("sale")
            .leftJoinAndSelect("sale.items", "item")
            .leftJoinAndSelect("item.product", "product")
            .leftJoinAndSelect("sale.user", "user")
            .where("sale.status = :status", { status: "charged" });

        if (shiftIds.length > 0) {
            salesQuery.andWhere("sale.shift_id IN (:...shiftIds)", { shiftIds });
        }

        const sales = await salesQuery.getMany();

        // Dashboard stats
        const dashboard = await this.calculateDashboardStats(sales, start, end);

        // Top productos más vendidos
        const topProducts = await this.getTopProducts(sales);

        // Productos con stock bajo
        const lowStockProducts = await this.getLowStockProducts();

        // Ventas por hora
        const salesByHour = this.getSalesByHour(sales);

        // Ventas diarias
        const dailySales = this.getDailySales(sales);

        // Métodos de pago
        const paymentMethods = this.getPaymentMethods(sales);

        // Ventas por categoría
        const salesByCategory = await this.getSalesByCategory(sales);

        // Ventas por proveedor
        const salesByProvider = await this.getSalesByProvider(sales);

        // Rendimiento por usuario
        const userPerformance = this.getUserPerformance(sales);

        return {
            periodo: {
                startDate: start.toISOString(),
                endDate: end.toISOString(),
            },
            dashboard,
            topProducts,
            lowStockProducts,
            salesByHour,
            dailySales,
            paymentMethods,
            salesByCategory,
            salesByProvider,
            userPerformance,
        };
    }

    private async calculateDashboardStats(sales: Sale[], startDate: Date, endDate: Date): Promise<DashboardStatsDto> {
        const ingresosTotales = sales.reduce((sum, s) => sum + Number(s.total), 0);
        const totalVentas = sales.length;

        // Calcular ganancia
        let gananciaTotal = 0;
        for (const sale of sales) {
            for (const item of sale.items) {
                const ingreso = Number(item.unitPrice) * Number(item.quantity);
                const costo = Number(item.product?.unitCost || 0) * Number(item.quantity);
                gananciaTotal += ingreso - costo;
            }
        }

        // Gastos del período
        const expenses = await this.expenseRepository
            .createQueryBuilder("expense")
            .where("expense.expense_date BETWEEN :start AND :end", { start: startDate, end: endDate })
            .getMany();
        const totalGastos = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

        // Extracciones
        const withdrawals = await this.withdrawalRepository
            .createQueryBuilder("withdrawal")
            .where("withdrawal.created_at BETWEEN :start AND :end", { start: startDate, end: endDate })
            .getMany();
        const totalWithdrawals = withdrawals.reduce((sum, w) => sum + Number(w.amount), 0);

        const gananciaNeta = gananciaTotal - totalGastos - totalWithdrawals;
        const ticketPromedio = totalVentas > 0 ? ingresosTotales / totalVentas : 0;
        const productosVendidos = sales.reduce((sum, s) =>
            sum + s.items.reduce((itemSum, item) => itemSum + Number(item.quantity), 0), 0);
        const clientesAtendidos = new Set(sales.map(s => s.userId)).size;

        return {
            totalVentas,
            ingresosTotales: parseFloat(ingresosTotales.toFixed(2)),
            gananciaTotal: parseFloat(gananciaTotal.toFixed(2)),
            totalGastos: parseFloat(totalGastos.toFixed(2)),
            gananciaNeta: parseFloat(gananciaNeta.toFixed(2)),
            ticketPromedio: parseFloat(ticketPromedio.toFixed(2)),
            productosVendidos,
            clientesAtendidos,
        };
    }

    private async getTopProducts(sales: Sale[]): Promise<TopProductDto[]> {
        const productMap = new Map<number, { name: string; quantity: number; revenue: number }>();

        for (const sale of sales) {
            for (const item of sale.items) {
                const existing = productMap.get(item.productId);
                if (existing) {
                    existing.quantity += Number(item.quantity);
                    existing.revenue += Number(item.unitPrice) * Number(item.quantity);
                } else {
                    productMap.set(item.productId, {
                        name: item.product.name,
                        quantity: Number(item.quantity),
                        revenue: Number(item.unitPrice) * Number(item.quantity),
                    });
                }
            }
        }

        const products = await this.productRepository.find();
        const result = Array.from(productMap.entries()).map(([id, data]) => {
            const product = products.find(p => p.id === id);
            return {
                productId: id,
                productName: data.name,
                quantitySold: data.quantity,
                totalRevenue: parseFloat(data.revenue.toFixed(2)),
                stock: product?.stock || 0,
                unitPrice: product?.unitPrice || 0,
            };
        });

        return result.sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 10);
    }

    private async getLowStockProducts(): Promise<LowStockProductDto[]> {
        const products = await this.productRepository
            .createQueryBuilder("product")
            .where("product.stock < 10")
            .andWhere("product.isActive = :isActive", { isActive: true })
            .orderBy("product.stock", "ASC")
            .limit(20)
            .getMany();

        return products.map(p => ({
            productId: p.id,
            productName: p.name,
            stock: p.stock,
            unitPrice: p.unitPrice,
            category: p.category || "Sin categoría",
        }));
    }

    private getSalesByHour(sales: Sale[]): SalesByHourDto[] {
        const hourMap = new Map<number, { total: number; quantity: number }>();

        for (let i = 0; i < 24; i++) {
            hourMap.set(i, { total: 0, quantity: 0 });
        }

        for (const sale of sales) {
            const hour = new Date(sale.createdAt).getHours();
            const existing = hourMap.get(hour)!;
            existing.total += Number(sale.total);
            existing.quantity += 1;
        }

        return Array.from(hourMap.entries()).map(([hour, data]) => ({
            hour,
            total: parseFloat(data.total.toFixed(2)),
            quantity: data.quantity,
        }));
    }

    private getDailySales(sales: Sale[]): DailySalesDto[] {
        const dailyMap = new Map<string, { total: number; quantity: number; ganancia: number }>();

        for (const sale of sales) {
            const date = new Date(sale.createdAt).toISOString().split("T")[0];
            const existing = dailyMap.get(date) || { total: 0, quantity: 0, ganancia: 0 };

            let gananciaVenta = 0;
            for (const item of sale.items) {
                const ingreso = Number(item.unitPrice) * Number(item.quantity);
                const costo = Number(item.product?.unitCost || 0) * Number(item.quantity);
                gananciaVenta += ingreso - costo;
            }

            dailyMap.set(date, {
                total: existing.total + Number(sale.total),
                quantity: existing.quantity + 1,
                ganancia: existing.ganancia + gananciaVenta,
            });
        }

        return Array.from(dailyMap.entries())
            .map(([date, data]) => ({
                date,
                total: parseFloat(data.total.toFixed(2)),
                quantity: data.quantity,
                ganancia: parseFloat(data.ganancia.toFixed(2)),
            }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    private getPaymentMethods(sales: Sale[]): PaymentMethodReportDto[] {
        const methodMap = new Map<string, { total: number; count: number }>();
        const totalIngresos = sales.reduce((sum, s) => sum + Number(s.total), 0);

        for (const sale of sales) {
            const existing = methodMap.get(sale.paymentMethod) || { total: 0, count: 0 };
            methodMap.set(sale.paymentMethod, {
                total: existing.total + Number(sale.total),
                count: existing.count + 1,
            });
        }

        return Array.from(methodMap.entries()).map(([method, data]) => ({
            method,
            total: parseFloat(data.total.toFixed(2)),
            percentage: totalIngresos > 0 ? (data.total / totalIngresos) * 100 : 0,
            count: data.count,
        }));
    }

    private async getSalesByCategory(sales: Sale[]): Promise<CategorySalesDto[]> {
        const categoryMap = new Map<string, { total: number; quantity: number }>();
        const totalIngresos = sales.reduce((sum, s) => sum + Number(s.total), 0);

        for (const sale of sales) {
            for (const item of sale.items) {
                const category = item.product.category || "Sin categoría";
                const existing = categoryMap.get(category) || { total: 0, quantity: 0 };
                categoryMap.set(category, {
                    total: existing.total + (Number(item.unitPrice) * Number(item.quantity)),
                    quantity: existing.quantity + Number(item.quantity),
                });
            }
        }

        return Array.from(categoryMap.entries()).map(([category, data]) => ({
            category,
            total: parseFloat(data.total.toFixed(2)),
            percentage: totalIngresos > 0 ? (data.total / totalIngresos) * 100 : 0,
            quantity: data.quantity,
        })).sort((a, b) => b.total - a.total);
    }

    private async getSalesByProvider(sales: Sale[]): Promise<ProviderSalesDto[]> {
        const providerMap = new Map<string, { total: number; quantity: number; ganancia: number }>();

        for (const sale of sales) {
            for (const item of sale.items) {
                const provider = item.product.investor || "Sin proveedor";
                const existing = providerMap.get(provider) || { total: 0, quantity: 0, ganancia: 0 };
                const ingreso = Number(item.unitPrice) * Number(item.quantity);
                const costo = Number(item.product?.unitCost || 0) * Number(item.quantity);

                providerMap.set(provider, {
                    total: existing.total + ingreso,
                    quantity: existing.quantity + Number(item.quantity),
                    ganancia: existing.ganancia + (ingreso - costo),
                });
            }
        }

        return Array.from(providerMap.entries()).map(([provider, data]) => ({
            provider,
            total: parseFloat(data.total.toFixed(2)),
            quantity: data.quantity,
            ganancia: parseFloat(data.ganancia.toFixed(2)),
        })).sort((a, b) => b.total - a.total);
    }

    private getUserPerformance(sales: Sale[]): UserPerformanceDto[] {
        const userMap = new Map<number, { userName: string; totalVentas: number; ingresos: number; ganancia: number }>();

        for (const sale of sales) {
            if (!sale.userId) continue;

            const existing = userMap.get(sale.userId) || {
                userName: sale.user?.username || "Desconocido",
                totalVentas: 0,
                ingresos: 0,
                ganancia: 0,
            };

            let gananciaVenta = 0;
            for (const item of sale.items) {
                const ingreso = Number(item.unitPrice) * Number(item.quantity);
                const costo = Number(item.product?.unitCost || 0) * Number(item.quantity);
                gananciaVenta += ingreso - costo;
            }

            userMap.set(sale.userId, {
                userName: sale.user?.username || "Desconocido",
                totalVentas: existing.totalVentas + 1,
                ingresos: existing.ingresos + Number(sale.total),
                ganancia: existing.ganancia + gananciaVenta,
            });
        }

        return Array.from(userMap.entries()).map(([userId, data]) => ({
            userId,
            userName: data.userName,
            totalVentas: data.totalVentas,
            ingresosTotales: parseFloat(data.ingresos.toFixed(2)),
            gananciaTotal: parseFloat(data.ganancia.toFixed(2)),
            ticketPromedio: data.totalVentas > 0 ? data.ingresos / data.totalVentas : 0,
        })).sort((a, b) => b.ingresosTotales - a.ingresosTotales);
    }
}