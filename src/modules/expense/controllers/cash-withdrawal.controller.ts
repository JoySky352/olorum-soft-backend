import { Controller, Get, Post, Body, Query, UseGuards, Request } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { CashWithdrawalService } from "../services/cash-withdrawal.service";
import { CashWithdrawal } from "../entities/cash-withdrawal.entity";
import { CreateCashWithdrawalDto, GetCashWithdrawalsDto } from "../dto/cash-withdrawal.dto";
import { PaginatedResponseDto } from "src/core/dto/paginated-response.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";

@ApiTags("extracciones-caja")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("cash-withdrawals")
export class CashWithdrawalController {
    constructor(private readonly withdrawalService: CashWithdrawalService) { }

    @Post()
    @ApiOperation({ summary: "Registrar una extracción de caja" })
    @ApiResponse({ status: 201, type: CashWithdrawal })
    async create(@Body() dto: CreateCashWithdrawalDto, @Request() req): Promise<CashWithdrawal> {
        return this.withdrawalService.create(dto, req.user.id, req.user.username);
    }

    @Get()
    @ApiOperation({ summary: "Obtener historial de extracciones" })
    @ApiResponse({ status: 200, type: PaginatedResponseDto })
    async findAll(@Query() dto: GetCashWithdrawalsDto): Promise<PaginatedResponseDto<CashWithdrawal>> {
        return this.withdrawalService.findAll(dto);
    }
}