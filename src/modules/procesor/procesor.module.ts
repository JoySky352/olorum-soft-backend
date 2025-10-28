import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { SaleModule } from '../sale/sale.module';
import { ProcessSaleService } from './services/process-sale.service';
import { ProcessSaleController } from './controllers/process-sale.controller';
import { ProcessRefundService } from './services/process-refund.service';

@Module({
  imports: [InventoryModule, SaleModule],
  controllers: [ProcessSaleController],
  providers: [ProcessSaleService, ProcessRefundService],
})
export class ProcesorModule {}
