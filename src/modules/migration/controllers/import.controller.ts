import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ImportJsonDto } from '../dto/import-json.dto';
import { ImportProductsService } from '../services/import-products.service';
import { ImportSalesService } from '../services/import-sales.service';

@ApiTags('Importar')
@Controller('import')
export class ImportController {
  constructor(
    private readonly importProductsService: ImportProductsService,
    private readonly importSalesService: ImportSalesService,
  ) {}

  @Post('products')
  @ApiOperation({ summary: 'Subir json de los productos' })
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Json de los productos',
    type: ImportJsonDto,
  })
  uploadProductsFile(@UploadedFile() file: Express.Multer.File) {
    return this.importProductsService.importProducts(file);
  }

  @Post('sales')
  @ApiOperation({ summary: 'Subir json de las ventas' })
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Json de las ventas',
    type: ImportJsonDto,
  })
  uploadSalesFile(@UploadedFile() file: Express.Multer.File) {
    return this.importSalesService.importSales(file);
  }
}
