import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ShiftReportController } from "./controllers/shift-report.controller";
import { ShiftReportService } from "./services/shift-report.service";
import { Shift } from "../shift/entities/shift.entity";
import { Sale } from "../sale/entities/sale.entity";
import { ReportController } from "./controllers/report.controller";
import { DailyReportService } from "./services/daily-report.service";
import { InvestorReportService } from "./services/investor-report.service";
import { SaleModule } from "../sale/sale.module"; // Importar SaleModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Shift, Sale]),
    SaleModule,
  ],
  controllers: [ShiftReportController, ReportController],
  providers: [ShiftReportService, DailyReportService, InvestorReportService],
  exports: [ShiftReportService, DailyReportService, InvestorReportService],
})
export class ReportModule { }