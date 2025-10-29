import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ProcessSaleService } from "../services/process-sale.service";
import { Sale } from "src/modules/sale/entities/sale.entity";
import { CreateSaleDto } from "src/modules/sale/dto/create-sale.dto";
import { RefundSaleDto } from "src/modules/sale/dto/refund-sale.dto";
import { ProcessRefundService } from "../services/process-refund.service";

@ApiTags("ventas")
@Controller("sales")
export class ProcessSaleController {
  constructor(
    private readonly processSaleService: ProcessSaleService,
    private readonly processRefundService: ProcessRefundService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Crear una nueva venta" })
  @ApiResponse({ status: 201, description: "Venta creada", type: Sale })
  async create(@Body() dto: CreateSaleDto): Promise<Sale> {
    try {
      return await this.processSaleService.sale(dto);
    } catch (error) {
      throw new BadRequestException(
        (error as Error).message || "Error al crear la venta",
      );
    }
  }

  @Put(":id/refund")
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
        (error as Error).message || "Error al crear la venta",
      );
    }
  }
}
