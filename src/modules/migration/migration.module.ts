import { Module } from '@nestjs/common';
import { ImportProductsService } from './services/import-products.service';
import { InventoryModule } from '../inventory/inventory.module';
import { ImportController } from './controllers/import.controller';
import { ImportSalesService } from './services/import-sales.service';
import { SaleModule } from '../sale/sale.module';

@Module({
  imports: [InventoryModule, SaleModule],
  controllers: [ImportController],
  providers: [ImportProductsService, ImportSalesService],
})
export class MigrationModule {}
