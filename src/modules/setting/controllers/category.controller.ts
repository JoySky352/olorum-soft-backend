import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { CategoryService } from "../services/category.service";
import { Category } from "../entities/category.entity";
import { CreateCategoryDto, UpdateCategoryDto } from "../dto/category.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";

@ApiTags("categorias")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("categories")
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) { }

    @Post()
    @ApiOperation({ summary: "Crear una nueva categoría" })
    @ApiResponse({ status: 201, type: Category })
    create(@Body() dto: CreateCategoryDto): Promise<Category> {
        return this.categoryService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: "Obtener todas las categorías" })
    @ApiResponse({ status: 200, type: [Category] })
    findAll(): Promise<Category[]> {
        return this.categoryService.findAll();
    }

    @Get(":id")
    @ApiOperation({ summary: "Obtener una categoría por ID" })
    @ApiResponse({ status: 200, type: Category })
    findOne(@Param("id") id: string): Promise<Category> {
        return this.categoryService.findOne(+id);
    }

    @Patch(":id")
    @ApiOperation({ summary: "Actualizar una categoría" })
    @ApiResponse({ status: 200, type: Category })
    update(@Param("id") id: string, @Body() dto: UpdateCategoryDto): Promise<Category> {
        return this.categoryService.update(+id, dto);
    }

    @Delete(":id")
    @ApiOperation({ summary: "Eliminar una categoría" })
    @ApiResponse({ status: 200 })
    remove(@Param("id") id: string): Promise<void> {
        return this.categoryService.remove(+id);
    }
}