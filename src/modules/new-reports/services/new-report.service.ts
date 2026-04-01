import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { Sale } from "../../sale/entities/sale.entity";
import { SaleItem } from "../../sale/entities/sale-item.entity";
import { Product } from "../../inventory/entities/product.entity";
import { User } from "../../user/user.entity";
import { GetNewReportsDto } from "../dto/get-new-reports.dto";
import { CubaDateHelper } from "../helpers/date-helper";
import {
    SalesByDateDto,
    SalesByUserDto,
    SalesByPaymentMethodDto,
    TopProductsDto,
    SalesByProviderDto,
    SalesByCategoryDto,
    CompleteReportDto,
} from "../dto/new-report-responses.dto";

@Injectable()
export class NewReportService {
    constructor(
        @InjectRepository(Sale)
        private saleRepository: Repository<Sale>,
        @InjectRepository(SaleItem)
        private saleItemRepository: Repository<SaleItem>,
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async getCompleteReport(dto: GetNewReportsDto): Promise<CompleteReportDto> {
        // Obtener fechas en hora de Cuba
        const start = dto.startDate
            ? CubaDateHelper.getStartOfDay(new Date(dto.startDate))
            : CubaDateHelper.getStartOfDay(new Date(new Date().setDate(1)));

        const end = dto.endDate
            ? CubaDateHelper.getEndOfDay(new Date(dto.endDate))
            : CubaDateHelper.getEndOfDay(new Date());

        const queryBuilder = this.saleRepository
            .createQueryBuilder("sale")
            .leftJoinAndSelect("sale.items", "items")
            .leftJoinAndSelect("items.product", "product")
            .leftJoinAndSelect("sale.user", "user")
            .where("sale.created_at BETWEEN :start AND :end", {
                start: start.toISOString(),
                end: end.toISOString()
            });

        if (dto.userId) {
            queryBuilder.andWhere("sale.userId = :userId", { userId: dto.userId });
        }
        if (dto.paymentMethod) {
            queryBuilder.andWhere("sale.paymentMethod = :paymentMethod", { paymentMethod: dto.paymentMethod });
        }
        if (dto.status) {
            queryBuilder.andWhere("sale.status = :status", { status: dto.status });
        }

        const sales = await queryBuilder.getMany();

        // Filtrar solo ventas pagadas para cálculos financieros
        const chargedSales = sales.filter(s => s.status === 'charged');

        // Resumen general
        const ingresosTotales = chargedSales
            .filter(s => s.paymentMethod !== "Free")
            .reduce((sum, s) => sum + Number(s.total), 0);

        let costoTotal = 0;
        for (const sale of chargedSales) {
            for (const item of sale.items) {
                const costo = Number(item.product?.unitCost || 0) * Number(item.quantity);
                costoTotal += costo;
            }
        }

        const gananciaTotal = ingresosTotales - costoTotal;
        const totalVentas = chargedSales.length;
        const totalProductosVendidos = chargedSales.reduce((sum, s) => {
            return sum + s.items.reduce((itemSum, item) => itemSum + Number(item.quantity), 0);
        }, 0);
        const promedioPorVenta = totalVentas > 0 ? ingresosTotales / totalVentas : 0;

        // Ventas por día
        const ventasPorDia = this.groupByDate(chargedSales);

        // Ventas por usuario
        const ventasPorUsuario = this.groupByUser(chargedSales);

        // Ventas por método de pago
        const ventasPorMetodoPago = this.groupByPaymentMethod(chargedSales);

        // Productos más vendidos
        const productosMasVendidos = await this.getTopProducts(start, end, dto);

        // Ventas por proveedor
        const ventasPorProveedor = await this.groupByProvider(start, end, dto);

        // Ventas por categoría
        const ventasPorCategoria = await this.groupByCategory(start, end, dto);

        return {
            periodo: {
                startDate: CubaDateHelper.formatDate(start),
                endDate: CubaDateHelper.formatDate(end),
            },
            resumenGeneral: {
                totalVentas,
                ingresosTotales: parseFloat(ingresosTotales.toFixed(2)),
                gananciaTotal: parseFloat(gananciaTotal.toFixed(2)),
                totalProductosVendidos,
                promedioPorVenta: parseFloat(promedioPorVenta.toFixed(2)),
            },
            ventasPorDia,
            ventasPorUsuario,
            ventasPorMetodoPago,
            productosMasVendidos,
            ventasPorProveedor,
            ventasPorCategoria,
        };
    }

    private groupByDate(sales: Sale[]): SalesByDateDto[] {
        const grouped = new Map<string, { total: number; quantity: number }>();

        sales.forEach(sale => {
            const date = CubaDateHelper.formatDate(new Date(sale.createdAt)).split(' ')[0];
            const existing = grouped.get(date) || { total: 0, quantity: 0 };
            grouped.set(date, {
                total: existing.total + Number(sale.total),
                quantity: existing.quantity + 1,
            });
        });

        return Array.from(grouped.entries())
            .map(([date, { total, quantity }]) => ({
                date,
                total: parseFloat(total.toFixed(2)),
                quantity,
            }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    private groupByUser(sales: Sale[]): SalesByUserDto[] {
        const grouped = new Map<number, { username: string; totalVentas: number; ingresos: number; ganancia: number }>();

        sales.forEach(sale => {
            if (!sale.userId || sale.paymentMethod === "Free") return;

            const existing = grouped.get(sale.userId) || {
                username: sale.user?.username || 'Desconocido',
                totalVentas: 0,
                ingresos: 0,
                ganancia: 0,
            };

            const gananciaVenta = sale.items.reduce((sum, item) => {
                const ingreso = Number(item.unitPrice) * Number(item.quantity);
                const costo = Number(item.product?.unitCost || 0) * Number(item.quantity);
                return sum + (ingreso - costo);
            }, 0);

            grouped.set(sale.userId, {
                username: sale.user?.username || 'Desconocido',
                totalVentas: existing.totalVentas + 1,
                ingresos: existing.ingresos + Number(sale.total),
                ganancia: existing.ganancia + gananciaVenta,
            });
        });

        return Array.from(grouped.entries()).map(([userId, data]) => ({
            userId,
            username: data.username,
            totalVentas: data.totalVentas,
            ingresosTotales: parseFloat(data.ingresos.toFixed(2)),
            gananciaTotal: parseFloat(data.ganancia.toFixed(2)),
        })).sort((a, b) => b.ingresosTotales - a.ingresosTotales);
    }

    private groupByPaymentMethod(sales: Sale[]): SalesByPaymentMethodDto[] {
        const grouped = new Map<string, { totalVentas: number; montoTotal: number }>();

        sales.forEach(sale => {
            const method = sale.paymentMethod === "Free" ? "Cuenta Casa (Free)" : sale.paymentMethod;
            const monto = sale.paymentMethod === "Free"
                ? sale.items.reduce((sum, item) => sum + (Number(item.product?.unitCost || 0) * Number(item.quantity)), 0)
                : Number(sale.total);

            const existing = grouped.get(method) || { totalVentas: 0, montoTotal: 0 };
            grouped.set(method, {
                totalVentas: existing.totalVentas + 1,
                montoTotal: existing.montoTotal + monto,
            });
        });

        return Array.from(grouped.entries()).map(([paymentMethod, data]) => ({
            paymentMethod,
            totalVentas: data.totalVentas,
            montoTotal: parseFloat(data.montoTotal.toFixed(2)),
        }));
    }

    private async getTopProducts(start: Date, end: Date, dto: GetNewReportsDto): Promise<TopProductsDto[]> {
        const query = this.saleItemRepository
            .createQueryBuilder('item')
            .leftJoin('item.sale', 'sale')
            .leftJoin('item.product', 'product')
            .select('item.productId', 'productId')
            .addSelect('product.name', 'productName')
            .addSelect('SUM(item.quantity)', 'quantitySold')
            .addSelect('SUM(item.total)', 'totalRevenue')
            .where('sale.created_at BETWEEN :start AND :end', { start: start.toISOString(), end: end.toISOString() })
            .andWhere('sale.status = :status', { status: 'charged' })
            .groupBy('item.productId')
            .orderBy('quantitySold', 'DESC')
            .limit(10);

        if (dto.provider) {
            query.andWhere('product.investor = :provider', { provider: dto.provider });
        }
        if (dto.category) {
            query.andWhere('product.category = :category', { category: dto.category });
        }

        const results = await query.getRawMany();

        return results.map(r => ({
            productId: parseInt(r.productId),
            productName: r.productName,
            quantitySold: parseInt(r.quantitySold),
            totalRevenue: parseFloat(r.totalRevenue), // Cambiar de string a number
        }));
    }

    private async groupByProvider(start: Date, end: Date, dto: GetNewReportsDto): Promise<SalesByProviderDto[]> {
        const query = this.saleItemRepository
            .createQueryBuilder('item')
            .leftJoin('item.sale', 'sale')
            .leftJoin('item.product', 'product')
            .select('product.investor', 'provider')
            .addSelect('COUNT(DISTINCT sale.id)', 'totalVentas')
            .addSelect('SUM(item.total)', 'montoTotal')
            .addSelect('SUM((item.unitPrice - COALESCE(product.unitCost, 0)) * item.quantity)', 'gananciaTotal')
            .where('sale.created_at BETWEEN :start AND :end', { start: start.toISOString(), end: end.toISOString() })
            .andWhere('sale.status = :status', { status: 'charged' })
            .andWhere('product.investor IS NOT NULL')
            .groupBy('product.investor')
            .orderBy('montoTotal', 'DESC');

        const results = await query.getRawMany();

        return results.map(r => ({
            provider: r.provider,
            totalVentas: parseInt(r.totalVentas),
            montoTotal: parseFloat(r.montoTotal), // Cambiar de string a number
            gananciaTotal: parseFloat(r.gananciaTotal), // Cambiar de string a number
        }));
    }

    private async groupByCategory(start: Date, end: Date, dto: GetNewReportsDto): Promise<SalesByCategoryDto[]> {
        const query = this.saleItemRepository
            .createQueryBuilder('item')
            .leftJoin('item.sale', 'sale')
            .leftJoin('item.product', 'product')
            .select('product.category', 'category')
            .addSelect('COUNT(DISTINCT sale.id)', 'totalVentas')
            .addSelect('SUM(item.total)', 'montoTotal')
            .where('sale.created_at BETWEEN :start AND :end', { start: start.toISOString(), end: end.toISOString() })
            .andWhere('sale.status = :status', { status: 'charged' })
            .andWhere('product.category IS NOT NULL')
            .groupBy('product.category')
            .orderBy('montoTotal', 'DESC');

        const results = await query.getRawMany();

        return results.map(r => ({
            category: r.category,
            totalVentas: parseInt(r.totalVentas),
            montoTotal: parseFloat(r.montoTotal), // Cambiar de string a number
        }));
    }
}