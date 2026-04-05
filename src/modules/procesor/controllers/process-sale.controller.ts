import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  Put,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { ProcessSaleService } from "../services/process-sale.service";
import { Sale } from "src/modules/sale/entities/sale.entity";
import { CreateSaleDto } from "src/modules/sale/dto/create-sale.dto";
import { RefundSaleDto } from "src/modules/sale/dto/refund-sale.dto";
import { ProcessRefundService } from "../services/process-refund.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { ShiftService } from "../../shift/services/shift.service";
import { CompletePendingSaleDto } from "../../sale/dto/complete-pending-sale.dto";
import { CompletePendingSaleService } from "../../sale/services/complete-pending-sale.service";
import { EntityManager } from "typeorm";

@ApiTags("ventas")
@Controller("sales")
export class ProcessSaleController {
  constructor(
    private readonly processSaleService: ProcessSaleService,
    private readonly processRefundService: ProcessRefundService,
    private readonly shiftService: ShiftService,
    private readonly completePendingSaleService: CompletePendingSaleService,
    private readonly entityManager: EntityManager,
  ) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Crear una nueva venta" })
  @ApiResponse({ status: 201, description: "Venta creada", type: Sale })
  @ApiResponse({ status: 401, description: "No autorizado" })
  @ApiResponse({ status: 400, description: "No hay turno abierto" })
  async create(@Body() dto: CreateSaleDto, @Request() req): Promise<Sale> {
    // Verificar si el usuario tiene un turno abierto (excepto para ValePendiente? Se permite siempre)
    // Para ValePendiente también se requiere turno porque se descuenta stock
    const currentShift = await this.shiftService.getCurrentShift(req.user.id);
    if (!currentShift) {
      throw new BadRequestException("No hay un turno abierto. Debe abrir un turno antes de vender.");
    }
    try {
      const result = await this.processSaleService.sale(dto, req.user.id, currentShift.id);
      return result;
    } catch (error) {
      throw new BadRequestException((error as Error).message || "Error al crear la venta");
    }
  }

  @Put(":id/refund")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Devolver una venta" })
  @ApiResponse({ status: 200, description: "Venta devuelta parcial", type: Sale })
  async refund(@Param("id") id: number, @Body() dto: RefundSaleDto): Promise<Sale> {
    try {
      return await this.processRefundService.refund(id, dto);
    } catch (error) {
      throw new BadRequestException((error as Error).message || "Error al devolver la venta");
    }
  }

  @Post(":id/complete")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Completar un vale pendiente" })
  @ApiResponse({ status: 200, type: Sale })
  async completePending(@Param("id") id: number, @Body() dto: CompletePendingSaleDto, @Request() req) {
    return this.entityManager.transaction(async (manager) => {
      const sale = await this.completePendingSaleService.complete(id, dto, req.user.id, manager);
      return sale;
    });
  }
}