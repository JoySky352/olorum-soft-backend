import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  Query,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { PaginatedResponseDto } from "src/core/dto/paginated-response.dto";
import { GetSalesDto } from "../dto/get-sales.dto";
import { GetTotalSalesDto } from "../dto/get-total-sales";
import { PaymentMethodSummaryDto } from "../dto/sales-payment";
import { TotalSalesDto } from "../dto/total-sales.dto";
import { Sale } from "../entities/sale.entity";
import { SaleService } from "../services/sale.service";

@ApiTags("ventas")
@Controller("sales")
export class SaleController {
  constructor(
    private readonly saleService: SaleService,
  ) { }

  @Get()
  @ApiOperation({ summary: "Obtener ventas con filtros y paginación" })
  @ApiResponse({
    status: 200,
    description: "Lista paginada y filtrada de ventas",
  })
  async obtenerTodos(
    @Query() dto: GetSalesDto
  ): Promise<PaginatedResponseDto<Sale>> {
    try {
      // Forzar paginación "infinita": limit muy alto para obtener todas las ventas
      const allSalesDto = { ...dto, limit: 1000000, offset: 0 };
      return await this.saleService.findAll(allSalesDto);
    } catch (error) {
      throw new InternalServerErrorException(
        (error as Error).message || "Error al obtener ventas"
      );
    }
  }

  @Get("resumen/metodos-pago")
  @ApiOperation({
    summary: "Obtener la cantidad de ventas por método de pago",
  })
  @ApiResponse({
    status: 200,
    description: "Cantidad de ventas por métodos de pago",
    type: PaymentMethodSummaryDto,
  })
  async obtenerVentasPorMetodoPago(
    @Query() dto: GetTotalSalesDto
  ): Promise<PaymentMethodSummaryDto> {
    try {
      return await this.saleService.getVentasPorMetodoPago(dto);
    } catch (error) {
      throw new InternalServerErrorException(
        (error as Error).message ||
        "Error al obtener resumen por método de pago"
      );
    }
  }

  @Get("resumen/totales-por-dia")
  @ApiOperation({ summary: "Obtener resumen de ventas por fecha o rango" })
  async obtenerResumenVentasPorFecha(
    @Query() dto: GetSalesDto
  ): Promise<TotalSalesDto> {
    try {
      if (!dto.startDate || !dto.endDate) {
        throw new BadRequestException(
          "Debe proporcionar startDate y endDate en formato ISO."
        );
      }

      return await this.saleService.getResumenVentasPorFecha(dto);
    } catch (error) {
      throw error instanceof BadRequestException
        ? error
        : new InternalServerErrorException(
          (error as Error).message || "Error al obtener el resumen diario"
        );
    }
  }

  @Get("pending")
  @ApiOperation({ summary: "Obtener vales pendientes" })
  async getPendingSales(@Query() dto: GetSalesDto) {
    const allDto: GetSalesDto = {
      ...dto,
      status: "pending",
      limit: dto.limit || 100,
      offset: dto.offset || 0,
    };
    return this.saleService.findAll(allDto);
  }
}