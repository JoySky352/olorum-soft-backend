import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { ProviderService } from "../services/provider.service";
import { Provider } from "../entities/provider.entity";
import { CreateProviderDto, UpdateProviderDto } from "../dto/provider.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";

@ApiTags("proveedores")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("providers")
export class ProviderController {
    constructor(private readonly providerService: ProviderService) { }

    @Post()
    @ApiOperation({ summary: "Crear un nuevo proveedor" })
    @ApiResponse({ status: 201, type: Provider })
    create(@Body() dto: CreateProviderDto): Promise<Provider> {
        return this.providerService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: "Obtener todos los proveedores" })
    @ApiResponse({ status: 200, type: [Provider] })
    findAll(): Promise<Provider[]> {
        return this.providerService.findAll();
    }

    @Get(":id")
    @ApiOperation({ summary: "Obtener un proveedor por ID" })
    @ApiResponse({ status: 200, type: Provider })
    findOne(@Param("id") id: string): Promise<Provider> {
        return this.providerService.findOne(+id);
    }

    @Patch(":id")
    @ApiOperation({ summary: "Actualizar un proveedor" })
    @ApiResponse({ status: 200, type: Provider })
    update(@Param("id") id: string, @Body() dto: UpdateProviderDto): Promise<Provider> {
        return this.providerService.update(+id, dto);
    }

    @Delete(":id")
    @ApiOperation({ summary: "Eliminar un proveedor" })
    @ApiResponse({ status: 200 })
    remove(@Param("id") id: string): Promise<void> {
        return this.providerService.remove(+id);
    }
}