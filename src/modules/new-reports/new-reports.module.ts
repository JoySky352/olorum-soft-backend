import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NewReportController } from "./controllers/new-report.controller";
import { NewReportService } from "./services/new-report.service";
import { Sale } from "../sale/entities/sale.entity";
import { SaleItem } from "../sale/entities/sale-item.entity";
import { Product } from "../inventory/entities/product.entity";
import { User } from "../user/user.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([Sale, SaleItem, Product, User]),
    ],
    controllers: [NewReportController],
    providers: [NewReportService],
    exports: [NewReportService],
})
export class NewReportsModule { }