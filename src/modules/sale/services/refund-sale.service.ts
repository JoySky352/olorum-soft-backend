import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { EntityManager } from "typeorm";
import { Sale } from "../entities/sale.entity";
import { RefundSaleDto } from "../dto/refund-sale.dto";
import { SaleItem } from "../entities/sale-item.entity";

@Injectable()
export class RefundSaleService {
  async refund(id: number, dto: RefundSaleDto, manager: EntityManager) {
    const sale = await manager.findOne(Sale, {
      where: { id },
      relations: { items: true },
    });

    if (!sale) throw new NotFoundException(`Venta con ID: ${id} no encontrada`);
    if (!["charged", "refunded"].includes(sale.status))
      throw new BadRequestException(
        `Venta con ID: ${id} y Estado: ${sale.status} no se puede devolver`,
      );

    const items = sale.items.map((i) => {
      const refundItem = dto.items.find(({ id }) => id === i.id);
      if (!refundItem) return i;
      const quantity = +i.quantity - refundItem.quantityToRefund;
      const quantityRefunded =
        +i.quantityRefunded + refundItem.quantityToRefund;
      const total = quantity * +i.unitPrice;
      const refunded = quantityRefunded * +i.unitPrice;
      return {
        ...i,
        refunded,
        total,
        quantity,
        quantityRefunded,
      };
    });

    await manager.save(SaleItem, items);
    const total = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const refunded = items.reduce(
      (sum, item) => sum + item.quantityRefunded * item.unitPrice,
      0,
    );
    sale.total = total;
    sale.refunded = refunded;
    sale.status = "refunded";
    sale.updatedAt = new Date();

    await manager.save(sale);

    return sale;
  }
}
