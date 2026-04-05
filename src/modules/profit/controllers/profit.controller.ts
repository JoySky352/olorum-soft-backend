import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProfitService } from '../services/profit.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../user/user.entity';

@ApiTags('profit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('profit')
export class ProfitController {
    constructor(private readonly profitService: ProfitService) { }

    @Get('report')
    @ApiOperation({ summary: 'Reporte de utilidades por período' })
    async getProfitReport(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
        return this.profitService.getProfitReport(new Date(startDate), new Date(endDate));
    }
}