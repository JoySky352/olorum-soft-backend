import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ShiftReportController } from "./controllers/shift-report.controller";
import { ShiftReportService } from "./services/shift-report.service";
import { Shift } from "../shift/entities/shift.entity";
import { Sale } from "../sale/entities/sale.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Shift, Sale])],
  controllers: [ShiftReportController],
  providers: [ShiftReportService],
  exports: [ShiftReportService],
})
export class ReportModule { }