import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { AdvancedReportService } from "../services/advanced-report.service";
import { GetAdvancedReportDto, AdvancedReportResponseDto } from "../dto/advanced-report.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "../../user/user.entity";

@ApiTags("reportes-avanzados")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller("advanced-reports")
export class AdvancedReportController {
  constructor(private readonly reportService: AdvancedReportService) {}

  @Get()
  @ApiOperation({ summary: "Obtener reporte avanzado con gráficos y estadísticas" })
  @ApiResponse({ status: 200, type: AdvancedReportResponseDto })
  async getAdvancedReport(@Query() dto: GetAdvancedReportDto): Promise<AdvancedReportResponseDto> {
    return this.reportService.getAdvancedReport(dto);
  }
}