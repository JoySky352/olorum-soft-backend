import { Injectable } from '@nestjs/common';
import { ProductLegacy } from '../interfaces/product-legacy.interface';
import { ProductService } from 'src/modules/inventory/services/product.service';

@Injectable()
export class ImportProductsService {
  constructor(private readonly productService: ProductService) {}

  async importProducts(file: Express.Multer.File) {
    const json = JSON.parse(file.buffer.toString()) as ProductLegacy[];
    await this.productService.createMany(
      json.map((i) => ({
        description: i.descripcion,
        name: i.nombre,
        stock: i.stock,
        unitCost: i.precioCosto,
        unitPrice: i.precioVenta,
        category: i.categoria,
        investor: i.proveedor,
        picture: i._id.$oid,
      })),
    );
  }
}
