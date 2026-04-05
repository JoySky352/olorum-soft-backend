import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SalaryPlanService } from '../services/salary-plan.service';
import { CreateSalaryPlanDto, UpdateSalaryPlanDto } from '../dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../user/user.entity';

@ApiTags('salary-plans')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('salary-plans')
export class SalaryPlanController {
    constructor(private readonly salaryPlanService: SalaryPlanService) { }

    @Post()
    @ApiOperation({ summary: 'Crear plan de salario' })
    create(@Body() dto: CreateSalaryPlanDto) {
        return this.salaryPlanService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Obtener todos los planes de salario' })
    findAll() {
        return this.salaryPlanService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener un plan por ID' })
    findOne(@Param('id') id: string) {
        return this.salaryPlanService.findOne(+id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar plan de salario' })
    update(@Param('id') id: string, @Body() dto: UpdateSalaryPlanDto) {
        return this.salaryPlanService.update(+id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar plan de salario' })
    remove(@Param('id') id: string) {
        return this.salaryPlanService.remove(+id);
    }
}