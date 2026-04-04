import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Sale } from "../../sale/entities/sale.entity";
import { SaleItem } from "../../sale/entities/sale-item.entity";
import { Product } from "../../inventory/entities/product.entity";
import { Shift } from "../../shift/entities/shift.entity";
import { Expense } from "../../expense/entities/expense.entity";
import { CashWithdrawal } from "../../expense/entities/cash-withdrawal.entity";
import { Category } from "../../setting/entities/category.entity";
import {
    GetAdvancedReportDto,
    AdvancedReportResponseDto,
    DashboardStatsDto,
    TopProductDto,
    LowStockProductDto,
    SalesByHourDto,
    DailySalesDto,
    PaymentMethodReportDto,
    CategorySalesDto,
    ProviderSalesDto,
    UserPerformanceDto,
    PopularLowStockProductDto,
    ExpiringProductDto,
    ProductMarginDto, // NUEVO
} from "../dto/advanced-report.dto";

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
        @InjectRepository(Category)
        private categoryRepository: Repository<Category>,
    ) { }

    async getAdvancedReport(dto: GetAdvancedReportDto): Promise<AdvancedReportResponseDto> {
        const { startDate, endDate, userId } = dto;

        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
        const end = endDate ? new Date(endDate) : new Date();
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        // Construir query de ventas
        const query = this.saleRepository
            .createQueryBuilder("sale")
            .leftJoinAndSelect("sale.items", "item")
            .leftJoinAndSelect("item.product", "product")
            .leftJoinAndSelect("sale.user", "user")
            .where("sale.status = :status", { status: "charged" })
            .andWhere("sale.created_at BETWEEN :start AND :end", { start, end });

        if (userId) {
            query.andWhere("sale.user_id = :userId", { userId });
        }

        const sales = await query.getMany();

        // Dashboard stats
        const dashboard = await this.calculateDashboardStats(sales, start, end);

        // Top productos más vendidos
        const topProducts = await this.getTopProducts(sales);

        // Productos con stock bajo (modificado para usar umbral por categoría)
        const lowStockProducts = await this.getLowStockProducts();

        // Productos populares con stock bajo
        const popularLowStockProducts = await this.getPopularLowStockProducts(sales);

        // Productos próximos a vencer en el mes actual
        const expiringProducts = await this.getExpiringProducts();

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

        // NUEVO: Margen por producto
        const productMargins = await this.getProductMargins();

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
            popularLowStockProducts,
            expiringProducts,
            productMargins, // NUEVO
        };
    }

    // ========== MÉTODOS EXISTENTES (tuyos, intactos) ==========

    private async calculateDashboardStats(sales: Sale[], startDate: Date, endDate: Date): Promise<DashboardStatsDto> {
        const ingresosTotales = sales.reduce((sum, s) => sum + Number(s.total), 0);
        const totalVentas = sales.length;

        let gananciaTotal = 0;
        for (const sale of sales) {
            for (const item of sale.items) {
                const ingreso = Number(item.unitPrice) * Number(item.quantity);
                const costo = Number(item.product?.unitCost || 0) * Number(item.quantity);
                gananciaTotal += ingreso - costo;
            }
        }

        const expenses = await this.expenseRepository
            .createQueryBuilder("expense")
            .where("expense.expense_date BETWEEN :start AND :end", { start: startDate, end: endDate })
            .getMany();
        const totalGastos = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

        const withdrawals = await this.withdrawalRepository
            .createQueryBuilder("withdrawal")
            .where("withdrawal.created_at BETWEEN :start AND :end", { start: startDate, end: endDate })
            .getMany();
        const totalWithdrawals = withdrawals.reduce((sum, w) => sum + Number(w.amount), 0);

        const gananciaNeta = gananciaTotal - totalGastos - totalWithdrawals;
        const ticketPromedio = totalVentas > 0 ? ingresosTotales / totalVentas : 0;
        const productosVendidos = sales.reduce((sum, s) =>
            sum + s.items.reduce((itemSum, item) => itemSum + Number(item.quantity), 0), 0);
        const clientesAtendidos = sales.length;

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
            .where("product.isActive = :isActive", { isActive: true })
            .getMany();

        const categories = await this.categoryRepository.find();
        const categoryThresholdMap = new Map<string, number>();
        for (const cat of categories) {
            if (cat.lowStockThreshold !== null && cat.lowStockThreshold !== undefined) {
                categoryThresholdMap.set(cat.name, cat.lowStockThreshold);
            }
        }
        const DEFAULT_THRESHOLD = 10;

        const lowStock: LowStockProductDto[] = [];
        for (const product of products) {
            const threshold = categoryThresholdMap.get(product.category || '') ?? DEFAULT_THRESHOLD;
            if (product.stock < threshold) {
                lowStock.push({
                    productId: product.id,
                    productName: product.name,
                    stock: product.stock,
                    unitPrice: product.unitPrice,
                    category: product.category || "Sin categoría",
                });
            }
        }
        return lowStock.sort((a, b) => a.stock - b.stock).slice(0, 20);
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

    // ========== NUEVOS MÉTODOS ==========

    private async getPopularLowStockProducts(sales: Sale[]): Promise<PopularLowStockProductDto[]> {
        const productSalesMap = new Map<number, { name: string; quantity: number; category: string }>();
        for (const sale of sales) {
            for (const item of sale.items) {
                const existing = productSalesMap.get(item.productId);
                if (existing) {
                    existing.quantity += Number(item.quantity);
                } else {
                    productSalesMap.set(item.productId, {
                        name: item.product.name,
                        quantity: Number(item.quantity),
                        category: item.product.category || "Sin categoría",
                    });
                }
            }
        }
        const topProducts = Array.from(productSalesMap.entries())
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

        const categories = await this.categoryRepository.find();
        const categoryThresholdMap = new Map<string, number>();
        for (const cat of categories) {
            if (cat.lowStockThreshold !== null && cat.lowStockThreshold !== undefined) {
                categoryThresholdMap.set(cat.name, cat.lowStockThreshold);
            }
        }
        const DEFAULT_THRESHOLD = 10;

        const popularLowStock: PopularLowStockProductDto[] = [];
        for (const prod of topProducts) {
            const productEntity = await this.productRepository.findOne({ where: { id: prod.id } });
            if (!productEntity) continue;
            const threshold = categoryThresholdMap.get(prod.category) ?? DEFAULT_THRESHOLD;
            if (productEntity.stock <= threshold) {
                popularLowStock.push({
                    productId: prod.id,
                    productName: prod.name,
                    quantitySold: prod.quantity,
                    stock: productEntity.stock,
                    threshold: threshold,
                    category: prod.category,
                });
            }
        }
        return popularLowStock.sort((a, b) => b.quantitySold - a.quantitySold);
    }

    private async getExpiringProducts(): Promise<ExpiringProductDto[]> {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        startOfMonth.setHours(0, 0, 0, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        const products = await this.productRepository
            .createQueryBuilder("product")
            .where("product.expiryDate IS NOT NULL")
            .andWhere("product.expiryDate BETWEEN :start AND :end", { start: startOfMonth, end: endOfMonth })
            .andWhere("product.stock > 0")
            .andWhere("product.isActive = :isActive", { isActive: true })
            .getMany();

        const result: ExpiringProductDto[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const product of products) {
            if (!product.expiryDate) continue;
            const expiryDateObj = product.expiryDate instanceof Date ? product.expiryDate : new Date(product.expiryDate);
            expiryDateObj.setHours(0, 0, 0, 0);
            const diffTime = expiryDateObj.getTime() - today.getTime();
            const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const expiryDateStr = expiryDateObj.toISOString().split('T')[0];

            result.push({
                productId: product.id,
                productName: product.name,
                expiryDate: expiryDateStr,
                stock: product.stock,
                daysUntilExpiry: daysUntilExpiry,
                category: product.category || "Sin categoría",
            });
        }
        return result.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
    }

    async getProductMargins(): Promise<ProductMarginDto[]> {
        const products = await this.productRepository.find({
            where: { isActive: true },
            order: { name: 'ASC' },
        });
        const margins = products.map(p => {
            const marginAmount = p.unitPrice - p.unitCost;
            const marginPercentage = p.unitPrice > 0 ? (marginAmount / p.unitPrice) * 100 : 0;
            return {
                productId: p.id,
                productName: p.name,
                category: p.category,
                investor: p.investor,
                unitCost: p.unitCost,
                unitPrice: p.unitPrice,
                stock: p.stock,
                marginAmount: parseFloat(marginAmount.toFixed(2)),
                marginPercentage: parseFloat(marginPercentage.toFixed(1)),
            };
        });
        return margins.sort((a, b) => b.marginPercentage - a.marginPercentage);
    }
}