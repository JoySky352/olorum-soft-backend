import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { EntityManager } from "typeorm";
import { Sale } from "../entities/sale.entity";
import { RefundSaleDto } from "../dto/refund-sale.dto";
import { SaleItem } from "../entities/sale-item.entity";
import { Product } from "../../inventory/entities/product.entity";

@Injectable()
export class RefundSaleService {
  async refund(id: number, dto: RefundSaleDto, manager: EntityManager) {
    const sale = await manager.findOne(Sale, {
      where: { id },
      relations: { items: true },
    });

    if (!sale) throw new NotFoundException(`Venta con ID: ${id} no encontrada`);
    if (!["charged", "partial_refund", "refunded"].includes(sale.status))
      throw new BadRequestException(
        `Venta con ID: ${id} y Estado: ${sale.status} no se puede devolver`,
      );

    // Verificar que no se devuelva más de lo vendido
    for (const refundItem of dto.items) {
      const originalItem = sale.items.find(i => i.id === refundItem.id);
      if (!originalItem) {
        throw new BadRequestException(`Item con ID ${refundItem.id} no encontrado`);
      }
      const availableToRefund = originalItem.quantity - originalItem.quantityRefunded;
      if (refundItem.quantityToRefund > availableToRefund) {
        throw new BadRequestException(
          `No se puede devolver más de ${availableToRefund} unidades del producto`
        );
      }
      if (!Number.isInteger(refundItem.quantityToRefund) || refundItem.quantityToRefund < 0) {
        throw new BadRequestException(`La cantidad a devolver debe ser un número entero positivo`);
      }
    }

    let totalRefundAmount = 0;

    const items = sale.items.map((i) => {
      const refundItem = dto.items.find(({ id }) => id === i.id);
      if (!refundItem) return i;

      const quantity = i.quantity - refundItem.quantityToRefund;
      const quantityRefunded = i.quantityRefunded + refundItem.quantityToRefund;
      const total = quantity * i.unitPrice;
      const refunded = quantityRefunded * i.unitPrice;
      totalRefundAmount += refunded;

      return {
        ...i,
        refunded,
        total,
        quantity,
        quantityRefunded,
      };
    });

    await manager.save(SaleItem, items);

    // Actualizar el inventario (devolver stock)
    for (const refundItem of dto.items) {
      const originalItem = sale.items.find(i => i.id === refundItem.id);
      if (originalItem && refundItem.quantityToRefund > 0) {
        const product = await manager.findOne(Product, {
          where: { id: originalItem.productId }
        });
        if (product) {
          product.stock = product.stock + refundItem.quantityToRefund;
          await manager.save(product);
        }
      }
    }

    // IMPORTANTE: NO modificar sale.total, mantener el original
    // Solo actualizar sale.refunded y el estado
    const newRefunded = (sale.refunded || 0) + totalRefundAmount;
    sale.refunded = newRefunded;

    // Determinar el estado
    if (newRefunded >= sale.total) {
      sale.status = "refunded";
    } else if (newRefunded > 0) {
      sale.status = "partial_refund";
    }

    sale.updatedAt = new Date();

    await manager.save(sale);

    return sale;
  }
}