/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PaginatedResponseDto } from "src/core/dto/paginated-response.dto";
import { Repository } from "typeorm";
import { GetSalesDto } from "../dto/get-sales.dto";
import { GetTotalSalesDto } from "../dto/get-total-sales";
import { PaymentMethodSummaryDto } from "../dto/sales-payment";
import { TotalSalesDto } from "../dto/total-sales.dto";
import { Sale } from "../entities/sale.entity";

@Injectable()
export class SaleService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>
  ) {}

  async findAll(dto: GetSalesDto): Promise<PaginatedResponseDto<Sale>> {
    const { limit = 10, offset = 0, startDate, endDate, status } = dto;

    const query = this.saleRepository
      .createQueryBuilder("sale")
      .leftJoinAndSelect("sale.items", "item")
      .leftJoinAndSelect("item.product", "product")
      .skip(offset)
      .take(limit);

    if (status) {
      query.andWhere("sale.status = :status", { status });
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      const sameDay =
        start.getFullYear() === end.getFullYear() &&
        start.getMonth() === end.getMonth() &&
        start.getDate() === end.getDate();

      const startOfDay = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate(),
        0,
        0,
        0,
        0
      );

      const endOfDay = new Date(
        end.getFullYear(),
        end.getMonth(),
        end.getDate(),
        23,
        59,
        59,
        999
      );

      query.andWhere("sale.created_at BETWEEN :start AND :end", {
        start: startOfDay,
        end: sameDay ? endOfDay : endOfDay,
      });
    } else if (startDate) {
      const start = new Date(startDate);
      const startOfDay = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate(),
        0,
        0,
        0,
        0
      );
      query.andWhere("sale.created_at >= :startDate", {
        startDate: startOfDay,
      });
    } else if (endDate) {
      const end = new Date(endDate);
      const endOfDay = new Date(
        end.getFullYear(),
        end.getMonth(),
        end.getDate(),
        23,
        59,
        59,
        999
      );
      query.andWhere("sale.created_at <= :endDate", {
        endDate: endOfDay,
      });
    }

    const [data, total] = await query.getManyAndCount();
    return new PaginatedResponseDto(data, total, limit, offset);
  }

  async getVentasPorMetodoPago(
    dto: GetTotalSalesDto
  ): Promise<PaymentMethodSummaryDto> {
    const { startDate, endDate } = dto;

    const normalizeDateRange = (
      startDate?: Date | string,
      endDate?: Date | string
    ) => {
      const range: { start?: Date; end?: Date } = {};

      if (startDate) {
        const start = new Date(startDate);
        range.start = new Date(start.setHours(0, 0, 0, 0));
      }
      if (endDate) {
        const end = new Date(endDate);
        range.end = new Date(end.setHours(23, 59, 59, 999));
      }

      return range;
    };

    const { start, end } = normalizeDateRange(startDate, endDate);

    // Definir la interfaz para los resultados
    interface PaymentMethodResult {
      paymentMethod: string;
      totalAmount: string;
    }

    const query = this.saleRepository
      .createQueryBuilder("sale")
      .select("sale.paymentMethod", "paymentMethod")
      .addSelect("SUM(sale.total)", "totalAmount")
      .where("sale.status = :status", { status: "charged" });

    if (start && end) {
      query.andWhere("sale.created_at BETWEEN :start AND :end", { start, end });
    } else if (start) {
      query.andWhere("sale.created_at >= :start", { start });
    } else if (end) {
      query.andWhere("sale.created_at <= :end", { end });
    }

    const results = (await query
      .groupBy("sale.paymentMethod")
      .getRawMany()) as PaymentMethodResult[];

    const summary: Record<string, number> = {
      efectivo: 0,
      transferencia: 0,
      free: 0,
    };

    for (const result of results) {
      const method = (result.paymentMethod?.toLowerCase() || "otros") as string;
      const totalAmount = Number(result.totalAmount || 0);

      if (method in summary) {
        summary[method] += totalAmount;
      }
    }

    const total = Object.values(summary).reduce((a, b) => a + b, 0);

    return {
      efectivo: summary.efectivo || 0,
      transferencia: summary.transferencia || 0,
      free: summary.free || 0,
      total,
    };
  }

  async findByDay(startDate: Date, status?: string): Promise<Sale[]> {
    const utcDate = new Date(startDate);
    const startOfDay = new Date(
      utcDate.getUTCFullYear(),
      utcDate.getUTCMonth(),
      utcDate.getUTCDate(),
      0,
      0,
      0,
      0
    );

    const endOfDay = new Date(
      utcDate.getUTCFullYear(),
      utcDate.getUTCMonth(),
      utcDate.getUTCDate(),
      23,
      59,
      59,
      999
    );

    endOfDay.setHours(endOfDay.getHours() - 5);

    const query = this.saleRepository
      .createQueryBuilder("sale")
      .leftJoinAndSelect("sale.items", "item")
      .leftJoinAndSelect("item.product", "product")
      .where("sale.created_at BETWEEN :start AND :end", {
        start: startOfDay,
        end: endOfDay,
      });

    if (status) {
      query.andWhere("sale.status = :status", { status });
    }

    const sales = await query.getMany();
    return sales;
  }

  async getResumenVentasPorFecha(dto: GetSalesDto): Promise<TotalSalesDto> {
    const { startDate, endDate, status } = dto;
    if (!startDate || !endDate) {
      throw new Error("Debe proporcionar ambas fechas: startDate y endDate");
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const sameDay =
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate();

    const startOfDay = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
      0,
      0,
      0,
      0
    );

    const endOfDay = new Date(
      end.getFullYear(),
      end.getMonth(),
      end.getDate(),
      23,
      59,
      59,
      999
    );

    const query = this.saleRepository
      .createQueryBuilder("sale")
      .leftJoinAndSelect("sale.items", "item")
      .leftJoinAndSelect("item.product", "product")
      .where("sale.created_at BETWEEN :start AND :end", {
        start: startOfDay,
        end: sameDay ? endOfDay : end,
      });

    if (status) {
      query.andWhere("sale.status = :status", { status });
    }

    const sales = await query.getMany();

    const totalVentas = sales.length;

    const ingresosTotales = sales.reduce((acc, s) => acc + Number(s.total), 0);

    const gananciaTotal = sales.reduce((acc, s) => {
      return (
        acc +
        s.items.reduce((sum, item) => {
          const ingreso = Number(item.unitPrice) * Number(item.quantity);
          const costo =
            Number(item.product?.unitCost || 0) * Number(item.quantity);
          return sum + (ingreso - costo);
        }, 0)
      );
    }, 0);

    return {
      totalVentas,
      ingresosTotales: parseFloat(ingresosTotales.toFixed(2)),
      gananciaTotal: parseFloat(gananciaTotal.toFixed(2)),
    };
  }
}
