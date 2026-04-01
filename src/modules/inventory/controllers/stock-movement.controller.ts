import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    UseGuards,
    Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { StockMovementService } from "../services/stock-movement.service";
import { CreateStockMovementDto, GetStockMovementsDto, CreateWastageDto } from "../dto/stock-movement.dto";
import { StockMovement } from "../entities/stock-movement.entity";
import { PaginatedResponseDto } from "src/core/dto/paginated-response.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";

@ApiTags("movimientos-stock")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("stock-movements")
export class StockMovementController {
    constructor(private readonly movementService: StockMovementService) { }

    @Post("entry")
    @ApiOperation({ summary: "Registrar una entrada de producto" })
    @ApiResponse({ status: 201, type: StockMovement })
    async createEntry(
        @Body() dto: CreateStockMovementDto,
        @Request() req,
    ): Promise<StockMovement> {
        return this.movementService.createEntry(
            dto,
            req.user.id,
            req.user.username,
        );
    }

    @Post("wastage")
    @ApiOperation({ summary: "Registrar una merma (pérdida de stock)" })
    @ApiResponse({ status: 201, type: StockMovement })
    async createWastage(
        @Body() dto: CreateWastageDto,
        @Request() req,
    ): Promise<StockMovement> {
        return this.movementService.createWastage(
            dto,
            req.user.id,
            req.user.username,
        );
    }

    @Get()
    @ApiOperation({ summary: "Obtener historial de movimientos" })
    @ApiResponse({ status: 200, type: PaginatedResponseDto })
    async findAll(
        @Query() dto: GetStockMovementsDto,
    ): Promise<PaginatedResponseDto<StockMovement>> {
        return this.movementService.findAll(dto);
    }
}