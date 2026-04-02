import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { ExpenseCategoryService } from "../services/expense-category.service";
import { ExpenseCategory } from "../entities/expense-category.entity";
import { CreateExpenseCategoryDto, UpdateExpenseCategoryDto } from "../dto/expense-category.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "../../user/user.entity";

@ApiTags("gastos-categorias")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller("expense-categories")
export class ExpenseCategoryController {
    constructor(private readonly categoryService: ExpenseCategoryService) { }

    @Post()
    @ApiOperation({ summary: "Crear una nueva categoría de gasto" })
    @ApiResponse({ status: 201, type: ExpenseCategory })
    create(@Body() dto: CreateExpenseCategoryDto): Promise<ExpenseCategory> {
        return this.categoryService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: "Obtener todas las categorías de gastos" })
    @ApiResponse({ status: 200, type: [ExpenseCategory] })
    findAll(): Promise<ExpenseCategory[]> {
        return this.categoryService.findAll();
    }

    @Get(":id")
    @ApiOperation({ summary: "Obtener una categoría por ID" })
    @ApiResponse({ status: 200, type: ExpenseCategory })
    findOne(@Param("id") id: string): Promise<ExpenseCategory> {
        return this.categoryService.findOne(+id);
    }

    @Patch(":id")
    @ApiOperation({ summary: "Actualizar una categoría" })
    @ApiResponse({ status: 200, type: ExpenseCategory })
    update(@Param("id") id: string, @Body() dto: UpdateExpenseCategoryDto): Promise<ExpenseCategory> {
        return this.categoryService.update(+id, dto);
    }

    @Delete(":id")
    @ApiOperation({ summary: "Eliminar una categoría" })
    @ApiResponse({ status: 200 })
    remove(@Param("id") id: string): Promise<void> {
        return this.categoryService.remove(+id);
    }
}