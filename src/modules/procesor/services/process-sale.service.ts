import { Injectable, Logger } from "@nestjs/common";
import { ProductService } from "src/modules/inventory/services/product.service";
import { CreateSaleDto } from "src/modules/sale/dto/create-sale.dto";
import { CreateSaleService } from "src/modules/sale/services/create-sale.service";
import { UpdateSaleService } from "src/modules/sale/services/update-sale.service";
import { EntityManager } from "typeorm";

@Injectable()
export class ProcessSaleService {
  private readonly logger = new Logger(ProcessSaleService.name);

  constructor(
    private readonly entityManager: EntityManager,
    private readonly createSaleService: CreateSaleService,
    private readonly productService: ProductService,
    private readonly updateSaleService: UpdateSaleService,
  ) { }

  async sale(dto: CreateSaleDto, userId?: number, shiftId?: number) {
    this.logger.log(`📦 Iniciando venta - Usuario: ${userId || 'anónimo'}, Turno: ${shiftId || 'sin turno'}`);

    return this.entityManager.transaction(async (manager) => {
      const sale = await this.createSaleService.create(dto, manager, userId, shiftId);
      this.logger.log(`📦 Venta creada con ID: ${sale.id}, Status: ${sale.status}`);

      const promises = dto.items.map((i) =>
        this.productService.updateStock(i.productId, -i.quantity, manager),
      );
      await Promise.all(promises);
      this.logger.log('📦 Stock actualizado');

      const chargedSale = await this.updateSaleService.charge(sale, manager);
      this.logger.log(`📦 Venta finalizada con ID: ${chargedSale.id}, Status: ${chargedSale.status}, Turno: ${chargedSale.shiftId}`);

      return chargedSale;
    });
  }
}