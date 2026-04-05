// backend/modules/procesor/procesor.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InventoryModule } from "../inventory/inventory.module";
import { SaleModule } from "../sale/sale.module";
import { ShiftModule } from "../shift/shift.module";
import { ProcessSaleService } from "./services/process-sale.service";
import { ProcessSaleController } from "./controllers/process-sale.controller";
import { ProcessRefundService } from "./services/process-refund.service";
import { CompletePendingSaleService } from "../sale/services/complete-pending-sale.service";
import { Sale } from "../sale/entities/sale.entity";

@Module({
  imports: [
    InventoryModule,
    SaleModule,
    ShiftModule,
    TypeOrmModule.forFeature([Sale]),
  ],
  controllers: [ProcessSaleController],
  providers: [
    ProcessSaleService,
    ProcessRefundService,
    CompletePendingSaleService,
  ],
})
export class ProcesorModule { }