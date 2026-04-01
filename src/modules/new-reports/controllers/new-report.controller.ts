import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { NewReportService } from "../services/new-report.service";
import { GetNewReportsDto } from "../dto/get-new-reports.dto";
import { CompleteReportDto } from "../dto/new-report-responses.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";

@ApiTags("new-reports")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("new-reports")
export class NewReportController {
    constructor(private readonly newReportService: NewReportService) { }

    @Get("complete")
    @ApiOperation({ summary: "Obtener reporte completo con todos los datos" })
    @ApiResponse({ status: 200, type: CompleteReportDto })
    async getCompleteReport(@Query() dto: GetNewReportsDto): Promise<CompleteReportDto> {
        return this.newReportService.getCompleteReport(dto);
    }
}