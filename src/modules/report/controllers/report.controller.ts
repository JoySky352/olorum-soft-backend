import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  Query,
  Res,
} from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { DailyReportService } from "../services/daily-report.service";
import { type Response } from "express";
import { InvestorReportService } from "../services/investor-report.service";

@ApiTags("Reportes")
@Controller("reports")
export class ReportController {
  constructor(
    private readonly dailyReportService: DailyReportService,
    private readonly investorReportService: InvestorReportService,
  ) {}

  @Get("daily/excel")
  @ApiOperation({ summary: "Descargar reporte diario en Excel" })
  @ApiQuery({ name: "date", type: String, example: "2025-07-20" })
  async descargarReporteDiarioExcel(
    @Query("date") fechaStr: string,
    @Res() res: Response,
  ) {
    try {
      const fecha = fechaStr;

      const buffer = await this.dailyReportService.getReport(new Date(fecha));

      res.set({
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=reporte-ventas-${fecha}.xlsx`,
      });

      res.send(buffer);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException("Error al generar el reporte");
    }
  }

  @Get("investor/excel")
  @ApiOperation({ summary: "Descargar reporte del provedor en Excel" })
  async descargarReporteProveedorExcel(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Query("investor") investor: string,
    @Res() res: Response,
  ) {
    try {
      const buffer = await this.investorReportService.getReport(
        investor,
        new Date(startDate),
        new Date(endDate),
      );

      res.set({
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=reporte-${`${investor}-${startDate}-${endDate}`}.xlsx`,
      });

      res.send(buffer);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException("Error al generar el reporte");
    }
  }
}
