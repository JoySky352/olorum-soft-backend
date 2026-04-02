import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, Res } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { ExpenseService } from "../services/expense.service";
import { Expense } from "../entities/expense.entity";
import { CreateExpenseDto, UpdateExpenseDto, GetExpensesDto } from "../dto/expense.dto";
import { PaginatedResponseDto } from "src/core/dto/paginated-response.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "../../user/user.entity";
import { ShiftService } from "../../shift/services/shift.service";
import type { Response } from "express";

@ApiTags("gastos")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("expenses")
export class ExpenseController {
    constructor(
        private readonly expenseService: ExpenseService,
        private readonly shiftService: ShiftService,
    ) { }

    @Post()
    @ApiOperation({ summary: "Registrar un nuevo gasto" })
    @ApiResponse({ status: 201, type: Expense })
    async create(@Body() dto: CreateExpenseDto, @Request() req): Promise<Expense> {
        const currentShift = await this.shiftService.getCurrentShift(req.user.id);
        return this.expenseService.create(dto, req.user.id, req.user.username, currentShift?.id);
    }

    @Get()
    @ApiOperation({ summary: "Obtener todos los gastos con filtros" })
    @ApiResponse({ status: 200, type: PaginatedResponseDto })
    async findAll(@Query() dto: GetExpensesDto): Promise<PaginatedResponseDto<Expense>> {
        return this.expenseService.findAll(dto);
    }

    @Get("summary")
    @ApiOperation({ summary: "Obtener resumen de gastos" })
    @ApiResponse({ status: 200 })
    async getSummary(@Query() dto: GetExpensesDto): Promise<any> {
        return this.expenseService.getSummary(dto);
    }

    @Get("export")
    @ApiOperation({ summary: "Exportar gastos a Excel" })
    @ApiResponse({ status: 200, description: "Archivo Excel" })
    async exportToExcel(@Query() dto: GetExpensesDto, @Res() res: Response) {
        const buffer = await this.expenseService.exportToExcel(dto);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=reporte-gastos-${Date.now()}.xlsx`);
        res.send(buffer);
    }

    @Get(":id")
    @ApiOperation({ summary: "Obtener un gasto por ID" })
    @ApiResponse({ status: 200, type: Expense })
    findOne(@Param("id") id: string): Promise<Expense> {
        return this.expenseService.findOne(+id);
    }

    @Patch(":id")
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: "Actualizar un gasto" })
    @ApiResponse({ status: 200, type: Expense })
    update(@Param("id") id: string, @Body() dto: UpdateExpenseDto): Promise<Expense> {
        return this.expenseService.update(+id, dto);
    }

    @Delete(":id")
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: "Eliminar un gasto" })
    @ApiResponse({ status: 200 })
    remove(@Param("id") id: string): Promise<void> {
        return this.expenseService.remove(+id);
    }
}