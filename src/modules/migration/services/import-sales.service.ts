import { Injectable } from '@nestjs/common';
import { SaleLegacy } from '../interfaces/sale-legacy.interface';
import { ProductService } from 'src/modules/inventory/services/product.service';
import { CreateSaleService } from 'src/modules/sale/services/create-sale.service';

@Injectable()
export class ImportSalesService {
  constructor(
    private readonly productService: ProductService,
    private readonly saleService: CreateSaleService,
  ) {}

  async importSales(file: Express.Multer.File) {
    const json = JSON.parse(file.buffer.toString()) as SaleLegacy[];
    const index = await this.productService.getIndexByPicture(
      json
        .reduce((prev, curr) => [...prev, ...curr.items], [])
        .map((i) => i.producto.$oid),
    );
    await this.saleService.createMany(
      json.map((i) => {
        const items = i.items.map((j) => ({
          productId: index[j.producto.$oid] || 0,
          quantity: j.cantidad,
          quantityRefunded: 0,
          refunded: 0,
          total: j.total,
          unitPrice: j.precioUnitario,
        }));
        return {
          paymentMethod: i.metodoPago,
          createdAt: new Date(i.createdAt.$date),
          refunded: 0,
          status: 'charged',
          total: i.total,
          updatedAt: new Date(i.updatedAt.$date),
          items,
        };
      }),
    );
  }
}
