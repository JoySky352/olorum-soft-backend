import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ThemeService } from '../services/theme.service';
import { Theme } from '../entities/theme.entity';
import { CreateThemeDto } from '../dto/create-theme.dto';

@ApiTags('Configuración')
@Controller('settings/theme')
export class ThemeController {
  constructor(private readonly themeService: ThemeService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo tema' })
  @ApiResponse({ status: 201, description: 'Tema creado', type: Theme })
  async create(@Body() dto: CreateThemeDto): Promise<Theme> {
    try {
      return await this.themeService.create(dto);
    } catch (error) {
      throw new BadRequestException(
        (error as Error).message || 'Error al crear el tema',
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Optiene el primer tema' })
  @ApiResponse({
    status: 200,
    description: 'Primer tema',
  })
  async getFirst(): Promise<Theme | null> {
    try {
      return await this.themeService.getFirst();
    } catch (error) {
      throw new InternalServerErrorException(
        (error as Error).message || 'Error al obtener el tema',
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un tema' })
  @ApiResponse({
    status: 200,
    description: 'Producto actualizado',
    type: Theme,
  })
  async actualizar(
    @Param('id') id: number,
    @Body() dto: CreateThemeDto,
  ): Promise<void> {
    await this.themeService.update(id, dto);
  }
}
