import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateThemeDto } from "../dto/create-theme.dto";
import { UpdateThemeDto } from "../dto/update-theme.dto";
import { ThemeService } from "../services/theme.service";

@ApiTags("Configuración")
@Controller("settings/theme")
export class ThemeController {
  constructor(private readonly themeService: ThemeService) {}

  @Post()
  @ApiOperation({ summary: "Crear un nuevo tema" })
  async create(@Body() dto: CreateThemeDto) {
    return this.themeService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: "Obtiene el tema activo (primer registro o crea por defecto)",
  })
  async getActive() {
    return this.themeService.getActiveTheme();
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtiene un tema por ID" })
  async getById(@Param("id", ParseIntPipe) id: number) {
    const theme = await this.themeService.getById(id);
    if (!theme) throw new NotFoundException("Tema no encontrado");
    return theme;
  }

  @Put(":id")
  @ApiOperation({ summary: "Reemplaza completamente un tema" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateThemeDto
  ) {
    return this.themeService.update(id, dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Actualiza parcialmente un tema" })
  async patch(
    @Param("id", ParseIntPipe) id: number,
    @Body() partial: Partial<CreateThemeDto>
  ) {
    return this.themeService.patch(id, partial);
  }
}
