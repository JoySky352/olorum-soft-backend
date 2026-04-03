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

// Definir la interfaz dentro del archivo
interface PaymentMethodResult {
  paymentMethod: string;
  totalAmount: string;
}

@Injectable()
export class SaleService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
  ) { }

  async findAll(dto: GetSalesDto): Promise<PaginatedResponseDto<Sale>> {
    const { limit = 10, offset = 0, startDate, endDate, status, shiftId } = dto;

    const query = this.saleRepository
      .createQueryBuilder("sale")
      .leftJoinAndSelect("sale.items", "item")
      .leftJoinAndSelect("item.product", "product")
      .leftJoinAndSelect("sale.user", "user")
      .skip(offset)
      .take(limit);

    if (status) {
      query.andWhere("sale.status = :status", { status });
    } else {
      // Por defecto, mostrar todas excepto 'created'
      query.andWhere("sale.status != :status", { status: "created" });
    }

    if (shiftId) {
      query.andWhere("sale.shift_id = :shiftId", { shiftId });
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
        0,
      );

      const endOfDay = new Date(
        end.getFullYear(),
        end.getMonth(),
        end.getDate(),
        23,
        59,
        59,
        999,
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
        0,
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
        999,
      );
      query.andWhere("sale.created_at <= :endDate", {
        endDate: endOfDay,
      });
    }

    const [data, total] = await query.getManyAndCount();
    return new PaginatedResponseDto(data, total, limit, offset);
  }

  async getVentasPorMetodoPago(
    dto: GetTotalSalesDto,
  ): Promise<PaymentMethodSummaryDto> {
    const { startDate, endDate } = dto;

    const normalizeDateRange = (
      startDate?: Date | string,
      endDate?: Date | string,
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

    // Obtener todas las ventas pagadas y con devolución parcial
    const sales = await this.saleRepository
      .createQueryBuilder("sale")
      .leftJoinAndSelect("sale.items", "item")
      .leftJoinAndSelect("item.product", "product")
      .where("sale.status IN (:...statuses)", {
        statuses: ["charged", "partial_refund"]
      })
      .andWhere("sale.created_at BETWEEN :start AND :end", { start, end })
      .getMany();

    let efectivoTotal = 0;
    let transferenciaTotal = 0;
    let mixtoTotal = 0;
    let freeCostoTotal = 0;

    for (const sale of sales) {
      // Calcular el monto efectivo real después de devoluciones
      const montoReal = sale.total - (sale.refunded || 0);

      if (sale.paymentMethod === "Efectivo") {
        efectivoTotal += montoReal;
      } else if (sale.paymentMethod === "Transferencia") {
        transferenciaTotal += montoReal;
      } else if (sale.paymentMethod === "USD" || sale.paymentMethod === "EUR") {
        // USD y EUR se tratan como efectivo
        efectivoTotal += montoReal;
      } else if (sale.paymentMethod === "Mixto") {
        // Para mixto, distribuir proporcionalmente el monto real
        const totalOriginal = sale.total;
        const efectivoOriginal = sale.efectivoAmount || 0;
        const transferenciaOriginal = sale.transferenciaAmount || 0;

        if (totalOriginal > 0 && montoReal > 0) {
          const efectivoReal = (montoReal * efectivoOriginal) / totalOriginal;
          const transferenciaReal = (montoReal * transferenciaOriginal) / totalOriginal;
          efectivoTotal += efectivoReal;
          transferenciaTotal += transferenciaReal;
        }
        mixtoTotal += montoReal;
      } else if (sale.paymentMethod === "Free") {
        // Calcular costo de productos vendidos como Free (solo lo no devuelto)
        for (const item of sale.items) {
          const cantidadNoDevuelta = item.quantity - (item.quantityRefunded || 0);
          const costo = Number(item.product?.unitCost || 0) * cantidadNoDevuelta;
          freeCostoTotal += costo;
        }
      }
    }

    const total = efectivoTotal + transferenciaTotal;

    return {
      efectivo: parseFloat(efectivoTotal.toFixed(2)),
      transferencia: parseFloat(transferenciaTotal.toFixed(2)),
      mixto: parseFloat(mixtoTotal.toFixed(2)),
      free: parseFloat(freeCostoTotal.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
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
      0,
    );

    const endOfDay = new Date(
      utcDate.getUTCFullYear(),
      utcDate.getUTCMonth(),
      utcDate.getUTCDate(),
      23,
      59,
      59,
      999,
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
      0,
    );

    const endOfDay = new Date(
      end.getFullYear(),
      end.getMonth(),
      end.getDate(),
      23,
      59,
      59,
      999,
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
    } else {
      // Incluir charged y partial_refund
      query.andWhere("sale.status IN (:...statuses)", {
        statuses: ["charged", "partial_refund"]
      });
    }

    const sales = await query.getMany();

    const totalVentas = sales.length;

    // Ingresos totales (excluyendo Free)
    const ingresosTotales = sales
      .filter(s => s.paymentMethod !== "Free")
      .reduce((acc, s) => acc + Number(s.total), 0);

    let costoTotal = 0;

    for (const sale of sales) {
      for (const item of sale.items) {
        const costo = Number(item.product?.unitCost || 0) * Number(item.quantity);
        costoTotal += costo;
      }
    }

    const gananciaTotal = ingresosTotales - costoTotal;

    return {
      totalVentas,
      ingresosTotales: parseFloat(ingresosTotales.toFixed(2)),
      gananciaTotal: parseFloat(gananciaTotal.toFixed(2)),
    };
  }
}