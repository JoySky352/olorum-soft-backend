import { BadRequestException, Injectable } from "@nestjs/common";
import { CreateSaleDto } from "../dto/create-sale.dto";
import { EntityManager, Repository } from "typeorm";
import { Sale } from "../entities/sale.entity";
import { SaleItem } from "../entities/sale-item.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { ImportSaleDto } from "../dto/import-sale.dto";

@Injectable()
export class CreateSaleService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private readonly saleItemRepository: Repository<SaleItem>,
  ) { }

  async create(dto: CreateSaleDto, manager: EntityManager, userId?: number, shiftId?: number) {

    const total =
      dto.paymentMethod === "Free" || dto.paymentMethod === "ValePendiente"
        ? 0
        : dto.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    if (total <= 0 && dto.paymentMethod !== "Free" && dto.paymentMethod !== "ValePendiente")
      throw new BadRequestException("El total de la venta debe ser mayor que 0");

    let paymentMethod = dto.paymentMethod;
    let originalPaymentMethod = dto.paymentMethod;

    if (dto.paymentMethod === "USD" || dto.paymentMethod === "EUR") {
      paymentMethod = "Efectivo";
      originalPaymentMethod = dto.paymentMethod;
    }

    const status: "created" | "charged" | "refunded" | "partial_refund" | "pending" =
      dto.paymentMethod === "ValePendiente" ? "pending" :
        dto.paymentMethod === "Free" ? "charged" :
          "created";

    const saleData: Partial<Sale> = {
      paymentMethod: paymentMethod,
      originalPaymentMethod: originalPaymentMethod,
      total,
      originalTotal: total,
      createdAt: new Date(),
      refunded: 0,
      status: status,
    };

    if (userId) saleData.userId = userId;
    if (shiftId) saleData.shiftId = shiftId;

    if (dto.mixedPayment) {
      saleData.efectivoAmount = dto.mixedPayment.efectivo;
      saleData.transferenciaAmount = dto.mixedPayment.transferencia;
    }

    const sale = manager.create(Sale, saleData);
    await manager.save(sale);

    await Promise.all(
      dto.items.map((item) => {
        const itemTotal = dto.paymentMethod === "Free" || dto.paymentMethod === "ValePendiente" ? 0 : item.unitPrice * item.quantity;
        if (itemTotal <= 0 && dto.paymentMethod !== "Free" && dto.paymentMethod !== "ValePendiente")
          return Promise.reject(new Error(`Total del producto con ID: ${item.productId} inválido`));
        const invoiceItem = manager.create(SaleItem, {
          sale,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          quantityRefunded: 0,
          refunded: 0,
          total: itemTotal,
        });
        return manager.save(invoiceItem);
      }),
    );

    return sale;
  }

  async createMany(dtos: ImportSaleDto[]) {
    const sales = await this.saleRepository.save(dtos);
    for (let index = 0; index < sales.length; index++) {
      const sale = sales[index];
      const dto = dtos[index];
      await this.saleItemRepository.save(
        dto.items.map((i) => ({ ...i, sale })),
      );
    }
  }
}