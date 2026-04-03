import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdvancedReportController } from "./controllers/advanced-report.controller";
import { AdvancedReportService } from "./services/advanced-report.service";
import { Sale } from "../sale/entities/sale.entity";
import { SaleItem } from "../sale/entities/sale-item.entity";
import { Product } from "../inventory/entities/product.entity";
import { Shift } from "../shift/entities/shift.entity";
import { Expense } from "../expense/entities/expense.entity";
import { CashWithdrawal } from "../expense/entities/cash-withdrawal.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Sale, SaleItem, Product, Shift, Expense, CashWithdrawal])],
    controllers: [AdvancedReportController],
    providers: [AdvancedReportService],
    exports: [AdvancedReportService],
})
export class AdvancedReportModule { }