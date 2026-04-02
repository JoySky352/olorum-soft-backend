import { Controller, Get, Query, UseGuards, Res } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { ShiftReportService } from "../services/shift-report.service";
import { GetShiftReportDto, ShiftReportResponseDto } from "../dto/shift-report.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import type { Response } from "express";

@ApiTags("reportes-turnos")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("reports/shifts")
export class ShiftReportController {
    constructor(private readonly shiftReportService: ShiftReportService) { }

    @Get()
    @ApiOperation({ summary: "Obtener reporte de turnos por rango de fechas" })
    @ApiResponse({ status: 200, type: ShiftReportResponseDto })
    async getShiftReport(@Query() dto: GetShiftReportDto): Promise<ShiftReportResponseDto> {
        return this.shiftReportService.getShiftReport(dto);
    }

    @Get("export")
    @ApiOperation({ summary: "Exportar reporte de turnos a Excel" })
    @ApiResponse({ status: 200, description: "Archivo Excel" })
    async exportShiftReport(@Query() dto: GetShiftReportDto, @Res() res: Response) {
        const buffer = await this.shiftReportService.exportShiftReportToExcel(dto);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=reporte-turnos-${Date.now()}.xlsx`);
        res.send(buffer);
    }
}