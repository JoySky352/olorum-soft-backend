import { Module } from "@nestjs/common";
import { ReportController } from "./controllers/report.controller";
import { DailyReportService } from "./services/daily-report.service";
import { SaleModule } from "../sale/sale.module";
import { InvestorReportService } from "./services/investor-report.service";

@Module({
  imports: [SaleModule],
  controllers: [ReportController],
  providers: [DailyReportService, InvestorReportService],
})
export class ReportModule {}
