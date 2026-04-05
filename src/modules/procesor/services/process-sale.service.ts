import { Injectable, Logger } from "@nestjs/common";
import { ProductService } from "src/modules/inventory/services/product.service";
import { CreateSaleService } from "src/modules/sale/services/create-sale.service";
import { UpdateSaleService } from "src/modules/sale/services/update-sale.service";
import { EntityManager } from "typeorm";
import { CreateSaleDto } from "src/modules/sale/dto/create-sale.dto";

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
    this.logger.log(`📦 Iniciando venta - Usuario: ${userId || 'anónimo'}, Turno: ${shiftId || 'sin turno'}, Método: ${dto.paymentMethod}`);

    return this.entityManager.transaction(async (manager) => {
      const sale = await this.createSaleService.create(dto, manager, userId, shiftId);
      this.logger.log(`📦 Venta creada con ID: ${sale.id}, Status: ${sale.status}`);

      // Actualizar stock (restar cantidades) siempre
      const promises = dto.items.map((i) =>
        this.productService.updateStock(i.productId, -i.quantity, manager),
      );
      await Promise.all(promises);
      this.logger.log('📦 Stock actualizado');

      // Solo cargar (cambiar a charged) si NO es ValePendiente y NO es Free
      if (dto.paymentMethod !== 'ValePendiente' && dto.paymentMethod !== 'Free') {
        const chargedSale = await this.updateSaleService.charge(sale, manager);
        this.logger.log(`📦 Venta finalizada con ID: ${chargedSale.id}, Status: ${chargedSale.status}, Turno: ${chargedSale.shiftId}`);
        return chargedSale;
      } else {
        this.logger.log(`📦 Venta ${sale.id} queda en estado ${sale.status} (no cargada)`);
        return sale;
      }
    });
  }
}