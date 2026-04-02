import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { ShiftService } from "../services/shift.service";
import { OpenShiftDto, CloseShiftDto, GetShiftsDto, ShiftReportDto } from "../dto/shift.dto";
import { Shift } from "../entities/shift.entity";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";

@ApiTags("turnos")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("shifts")
export class ShiftController {
    constructor(private readonly shiftService: ShiftService) { }

    @Post("open")
    @ApiOperation({ summary: "Abrir un turno" })
    @ApiResponse({ status: 201, type: Shift })
    async openShift(@Body() dto: OpenShiftDto, @Request() req): Promise<Shift> {
        return this.shiftService.openShift(req.user.id, req.user.username, dto);
    }

    @Post("close/:id")
    @ApiOperation({ summary: "Cerrar un turno (solo SUPER_ADMIN puede cerrar)" })
    @ApiResponse({ status: 200, type: Shift })
    async closeShift(
        @Param("id") id: number,
        @Body() dto: CloseShiftDto,
        @Request() req,
    ): Promise<Shift> {
        // Solo SUPER_ADMIN puede cerrar turnos (validación en frontend)
        return this.shiftService.closeShift(req.user.id, id, dto);
    }

    @Get("current")
    @ApiOperation({ summary: "Obtener turno actual del usuario" })
    @ApiResponse({ status: 200, type: Shift })
    async getCurrentShift(@Request() req): Promise<Shift | null> {
        return this.shiftService.getCurrentShift(req.user.id);
    }

    @Get("report/:id")
    @ApiOperation({ summary: "Obtener reporte de un turno específico" })
    @ApiResponse({ status: 200, type: ShiftReportDto })
    async getShiftReport(@Param("id") id: number): Promise<ShiftReportDto> {
        return this.shiftService.getShiftReport(id);
    }

    @Get()
    @ApiOperation({ summary: "Obtener reporte de turnos por fecha" })
    @ApiResponse({ status: 200, type: [ShiftReportDto] })
    async getShiftsReport(@Query() dto: GetShiftsDto): Promise<{ shifts: ShiftReportDto[]; total: number }> {
        return this.shiftService.getShiftsReport(dto);
    }
}