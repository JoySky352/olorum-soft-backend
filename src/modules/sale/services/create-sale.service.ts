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
    console.log('=== CREATE SALE SERVICE ===');
    console.log('DTO recibido:', JSON.stringify(dto, null, 2));

    const total =
      dto.paymentMethod === "Free"
        ? 0
        : dto.items.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0,
        );
    if (total <= 0 && dto.paymentMethod !== "Free")
      throw new BadRequestException(
        "El total de la venta debe ser mayor que 0",
      );

    let paymentMethod = dto.paymentMethod;

    // Para pagos en USD, la contabilidad se registra como Efectivo
    if (dto.paymentMethod === "USD") {
      paymentMethod = "Efectivo";
    }

    // Crear la venta con los datos
    const saleData: Partial<Sale> = {
      paymentMethod: paymentMethod,
      total,
      createdAt: new Date(),
      refunded: 0,
      status: "created",
    };

    if (userId) {
      saleData.userId = userId;
    }

    if (shiftId) {
      saleData.shiftId = shiftId;
    }

    // IMPORTANTE: Guardar desglose para pago mixto
    // Verificar si dto.mixedPayment existe
    if (dto.mixedPayment) {
      console.log('🔴 Procesando mixedPayment:', dto.mixedPayment);
      saleData.efectivoAmount = dto.mixedPayment.efectivo;
      saleData.transferenciaAmount = dto.mixedPayment.transferencia;
    } else {
      console.log('⚠️ No hay mixedPayment en el DTO');
    }

    const sale = manager.create(Sale, saleData);
    await manager.save(sale);
    console.log('✅ Venta guardada con efectivoAmount:', sale.efectivoAmount, 'transferenciaAmount:', sale.transferenciaAmount);

    await Promise.all(
      dto.items.map((item) => {
        const itemTotal = dto.paymentMethod === "Free" ? 0 : item.unitPrice * item.quantity;
        if (itemTotal <= 0 && dto.paymentMethod !== "Free")
          return Promise.reject(
            new Error(`Total del producto con ID: ${item.productId} inválido`),
          );
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