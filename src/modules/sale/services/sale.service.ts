import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Sale } from "../entities/sale.entity";
import { GetSalesDto } from "../dto/get-sales.dto";
import { PaginatedResponseDto } from "src/core/dto/paginated-response.dto";
import { TotalSalesDto } from "../dto/total-sales.dto";

@Injectable()
export class SaleService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
  ) {}

  async findAll(dto: GetSalesDto): Promise<PaginatedResponseDto<Sale>> {
    const { limit = 10, offset = 0, startDate, endDate, status } = dto;

    const query = this.saleRepository
      .createQueryBuilder("sale")
      .leftJoinAndSelect("sale.items", "item")
      .leftJoinAndSelect("item.product", "product")
      .skip(offset)
      .take(limit);

    if (status) query.andWhere("sale.status = :status", { status });

    if (startDate)
      query.andWhere("sale.created_at >= :startDate", {
        startDate: new Date(startDate).toISOString(),
      });

    if (endDate)
      query.andWhere("sale.created_at <= :endDate", {
        endDate: new Date(endDate).toISOString(),
      });
    const [data, total] = await query.getManyAndCount();

    return new PaginatedResponseDto(data, total, limit, offset);
  }

  async findAll2(dto: GetSalesDto): Promise<PaginatedResponseDto<Sale>> {
    const { limit = 10, offset = 0, startDate, endDate, status } = dto;

    const query = this.saleRepository
      .createQueryBuilder("sale")
      .leftJoinAndSelect("sale.items", "item")
      .leftJoinAndSelect("item.product", "product")
      .skip(offset)
      .take(limit);

    if (status) query.andWhere("sale.status = :status", { status });

    if (startDate)
      query.andWhere("sale.created_at >= :startDate", {
        startDate: new Date(startDate).toISOString().slice(0, 10),
      });

    if (endDate) query.andWhere("sale.created_at <= :endDate", { endDate });

    const [data, total] = await query.getManyAndCount();

    return new PaginatedResponseDto(data, total, limit, offset);
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

    // const startOfDay = new Date(
    //   start.getFullYear(),
    //   start.getMonth(),
    //   start.getDate(),
    //   0,
    //   0,
    //   0,
    //   0,
    // );

    // const endOfDay = new Date(
    //   end.getFullYear(),
    //   end.getMonth(),
    //   end.getDate(),
    //   23,
    //   59,
    //   59,
    //   999,
    // );

    const toUtc = (localDate: Date) => {
      const offsetMs = localDate.getTimezoneOffset() * 60 * 1000;
      return new Date(localDate.getTime() - offsetMs);
    };

    const startOfDay = toUtc(
      new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate(),
        0,
        0,
        0,
        0,
      ),
    );

    const endOfDay = toUtc(
      new Date(
        end.getFullYear(),
        end.getMonth(),
        end.getDate(),
        23,
        59,
        59,
        999,
      ),
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
