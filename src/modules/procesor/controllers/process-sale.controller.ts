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

@ApiTags("ventas")
@Controller("sales")
export class ProcessSaleController {
  constructor(
    private readonly processSaleService: ProcessSaleService,
    private readonly processRefundService: ProcessRefundService,
    private readonly shiftService: ShiftService,
  ) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Crear una nueva venta" })
  @ApiResponse({ status: 201, description: "Venta creada", type: Sale })
  @ApiResponse({ status: 401, description: "No autorizado" })
  @ApiResponse({ status: 400, description: "No hay turno abierto" })
  async create(@Body() dto: CreateSaleDto, @Request() req): Promise<Sale> {
    // Verificar si el usuario tiene un turno abierto
    const currentShift = await this.shiftService.getCurrentShift(req.user.id);

    if (!currentShift) {
      throw new BadRequestException("No hay un turno abierto. Debe abrir un turno antes de vender.");
    }

    try {
      const result = await this.processSaleService.sale(dto, req.user.id, currentShift.id);
      return result;
    } catch (error) {
      throw new BadRequestException(
        (error as Error).message || "Error al crear la venta",
      );
    }
  }

  @Put(":id/refund")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Devolver una venta" })
  @ApiResponse({
    status: 200,
    description: "Venta devuelta parcial",
    type: Sale,
  })
  async refund(
    @Param("id") id: number,
    @Body() dto: RefundSaleDto,
  ): Promise<Sale> {
    try {
      return await this.processRefundService.refund(id, dto);
    } catch (error) {
      throw new BadRequestException(
        (error as Error).message || "Error al devolver la venta",
      );
    }
  }
}