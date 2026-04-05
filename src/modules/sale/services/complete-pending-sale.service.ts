// backend/modules/sale/services/complete-pending-sale.service.ts
import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";
import { Sale } from "../entities/sale.entity";
import { CompletePendingSaleDto } from "../dto/complete-pending-sale.dto";

@Injectable()
export class CompletePendingSaleService {
    constructor(
        @InjectRepository(Sale)
        private saleRepository: Repository<Sale>,
    ) { }

    async complete(
        saleId: number,
        dto: CompletePendingSaleDto,
        userId: number,
        manager: EntityManager,
    ): Promise<Sale> {
        const sale = await manager.findOne(Sale, {
            where: { id: saleId },
            relations: ["items"],
        });

        if (!sale) throw new NotFoundException(`Venta con ID ${saleId} no encontrada`);
        if (sale.status !== "pending")
            throw new BadRequestException(`La venta no está pendiente (estado actual: ${sale.status})`);

        const realTotal = sale.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        if (realTotal <= 0)
            throw new BadRequestException("El total de la venta debe ser mayor que 0");

        let paymentMethod = dto.paymentMethod;
        let originalPaymentMethod = "ValePendiente";

        if (dto.paymentMethod === "USD" || dto.paymentMethod === "EUR") {
            paymentMethod = "Efectivo";
        }

        sale.status = "charged";
        sale.total = realTotal;
        sale.paymentMethod = paymentMethod;
        sale.originalPaymentMethod = originalPaymentMethod;
        sale.updatedAt = new Date();

        if (dto.mixedPayment) {
            sale.efectivoAmount = dto.mixedPayment.efectivo;
            sale.transferenciaAmount = dto.mixedPayment.transferencia;
        }

        // NO modificar shiftId - se mantiene el turno original donde se creó el vale
        await manager.save(sale);
        return sale;
    }
}