import { Injectable } from '@nestjs/common';
import { ProductService } from 'src/modules/inventory/services/product.service';
import { CreateSaleDto } from 'src/modules/sale/dto/create-sale.dto';
import { CreateSaleService } from 'src/modules/sale/services/create-sale.service';
import { UpdateSaleService } from 'src/modules/sale/services/update-sale.service';
import { EntityManager } from 'typeorm';

@Injectable()
export class ProcessSaleService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly createSaleService: CreateSaleService,
    private readonly productService: ProductService,
    private readonly updateSaleService: UpdateSaleService,
  ) {}

  sale(dto: CreateSaleDto) {
    return this.entityManager.transaction(async (manager) => {
      const sale = await this.createSaleService.create(dto, manager);
      const promises = dto.items.map((i) =>
        this.productService.updateStock(i.productId, -i.quantity, manager),
      );
      await Promise.all(promises);
      return this.updateSaleService.charge(sale, manager);
    });
  }
}
