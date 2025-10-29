import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Sale } from "./entities/sale.entity";
import { SaleItem } from "./entities/sale-item.entity";
import { CreateSaleService } from "./services/create-sale.service";
import { SaleService } from "./services/sale.service";
import { SaleController } from "./controller/sale.controller";
import { UpdateSaleService } from "./services/update-sale.service";
import { RefundSaleService } from "./services/refund-sale.service";

@Module({
  imports: [TypeOrmModule.forFeature([Sale, SaleItem])],
  controllers: [SaleController],
  providers: [
    CreateSaleService,
    SaleService,
    UpdateSaleService,
    RefundSaleService,
  ],
  exports: [
    CreateSaleService,
    UpdateSaleService,
    RefundSaleService,
    SaleService,
  ],
})
export class SaleModule {}
