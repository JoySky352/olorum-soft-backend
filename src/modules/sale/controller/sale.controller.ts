import {
  Controller,
  Get,
  InternalServerErrorException,
  Query,
  BadRequestException,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { GetSalesDto } from "../dto/get-sales.dto";
import { PaginatedResponseDto } from "src/core/dto/paginated-response.dto";
import { Sale } from "../entities/sale.entity";
import { SaleService } from "../services/sale.service";
import { TotalSalesDto } from "../dto/total-sales.dto";

@ApiTags("ventas")
@Controller("sales")
export class SaleController {
  constructor(private readonly saleService: SaleService) {}

  @Get()
  @ApiOperation({ summary: "Obtener ventas con filtros y paginación" })
  @ApiResponse({
    status: 200,
    description: "Lista paginada y filtrada de ventas",
  })
  async obtenerTodos(
    @Query() dto: GetSalesDto,
  ): Promise<PaginatedResponseDto<Sale>> {
    try {
      return await this.saleService.findAll(dto);
    } catch (error) {
      throw new InternalServerErrorException(
        (error as Error).message || "Error al obtener ventas",
      );
    }
  }

  @Get("resumen/totales-por-dia")
  @ApiOperation({ summary: "Obtener resumen de ventas por fecha o rango" })
  async obtenerResumenVentasPorFecha(
    @Query() dto: GetSalesDto,
  ): Promise<TotalSalesDto> {
    try {
      if (!dto.startDate || !dto.endDate) {
        throw new BadRequestException(
          "Debe proporcionar startDate y endDate en formato ISO.",
        );
      }

      return await this.saleService.getResumenVentasPorFecha(dto);
    } catch (error) {
      throw error instanceof BadRequestException
        ? error
        : new InternalServerErrorException(
            (error as Error).message || "Error al obtener el resumen diario",
          );
    }
  }
}
