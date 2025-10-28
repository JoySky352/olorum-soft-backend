import { Injectable } from '@nestjs/common';
import { ProductService } from 'src/modules/inventory/services/product.service';
import { RefundSaleDto } from 'src/modules/sale/dto/refund-sale.dto';
import { RefundSaleService } from 'src/modules/sale/services/refund-sale.service';
import { EntityManager } from 'typeorm';

@Injectable()
export class ProcessRefundService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly refundSaleService: RefundSaleService,
    private readonly productService: ProductService,
  ) {}

  refund(id: number, dto: RefundSaleDto) {
    return this.entityManager.transaction(async (manager) => {
      const sale = await this.refundSaleService.refund(id, dto, manager);
      const promises = dto.items.map((i) =>
        this.productService.updateStock(
          i.productId,
          i.quantityToRefund,
          manager,
        ),
      );
      await Promise.all(promises);
      return sale;
    });
  }
}
