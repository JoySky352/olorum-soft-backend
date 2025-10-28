/* eslint-disable */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  BadRequestException,
  InternalServerErrorException,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ProductService } from '../services/product.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadPictureDto } from '../dto/upload-picture.dto';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { GetProductsDto } from '../dto/get-products.dto';
import { PaginatedResponseDto } from 'src/core/dto/paginated-response.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductPictureService } from '../services/product-picture.service';

@ApiTags('productos')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService, private readonly pictureService: ProductPictureService) { }

  @Put(':id/picture')
  @ApiOperation({ summary: 'Subir imagen al producto' })
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Foto del producto',
    type: UploadPictureDto,
  })
  uploadFile(
    @Param('id') id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.pictureService.savePicture(id, file)
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo producto' })
  @ApiResponse({ status: 201, description: 'Producto creado', type: Product })
  async crear(@Body() dto: CreateProductDto): Promise<Product> {
    try {
      return await this.productService.create(dto);
    } catch (error) {
      throw new BadRequestException(error.message || 'Error al crear producto');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Obtener productos con filtros y paginación' })
  @ApiResponse({ status: 200, description: 'Lista paginada y filtrada de productos' })
  async obtenerTodos(@Query() dto: GetProductsDto): Promise<PaginatedResponseDto<Product>> {
    try {
      return await this.productService.findAll(dto);
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener productos');
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un producto' })
  @ApiResponse({
    status: 200,
    description: 'Producto actualizado',
    type: Product,
  })
  async actualizar(
    @Param('id') id: number,
    @Body() dto: UpdateProductDto,
  ): Promise<void> {
      await this.productService.update(
        id,
        dto,
      );
  }

  @Get('inventary/value')
  @ApiOperation({ summary: 'Calcular el valor total del inventario' })
  @ApiResponse({
    status: 200,
    description: 'Valores de inventario: costo, venta y ganancia',
  })
  async getAllInventory() {
    return this.productService.calculateAllStock()
  }
}
