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

    // Crear la venta con los datos
    const saleData: Partial<Sale> = {
      paymentMethod: dto.paymentMethod,
      total,
      createdAt: new Date(),
      refunded: 0,
      status: "created",
    };

    // Asignar userId solo si existe
    if (userId) {
      saleData.userId = userId;
    }

    // Asignar shiftId solo si existe
    if (shiftId) {
      saleData.shiftId = shiftId;
    }

    // Guardar desglose para pago en USD (opcional, para registro)
    if (dto.paymentMethod === "USD" && dto.usdPayment) {
      // La venta se guarda como Efectivo, pero podemos guardar metadata
      console.log('Pago en USD:', {
        usdAmount: dto.usdPayment.usdAmount,
        exchangeRate: dto.usdPayment.exchangeRate,
        cupAmount: dto.usdPayment.cupAmount,
        usdReceived: dto.usdPayment.usdReceived,
        changeInCUP: dto.usdPayment.changeInCUP
      });
      // La venta se registra como Efectivo para la contabilidad
      saleData.paymentMethod = "Efectivo";
    }

    const sale = manager.create(Sale, saleData);
    await manager.save(sale);

    await Promise.all(
      dto.items.map((item) => {
        const total =
          dto.paymentMethod === "Free" ? 0 : item.unitPrice * item.quantity;
        if (total <= 0 && dto.paymentMethod !== "Free")
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
          total,
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