// src/modules/setting/controllers/exchange-rate.controller.ts
import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ExchangeRateService } from '../services/exchange-rate.service';
import { UpdateExchangeRatesDto, ExchangeRateResponseDto } from '../dto/exchange-rate.dto';
import { JwtAuthGuard } from './../../auth/guards/jwt-auth.guard';
import { RolesGuard } from './../../auth/guards/roles.guard';
import { Roles } from './../../auth/decorators/roles.decorator';
import { UserRole } from './../../user/user.entity';

@Controller('exchange-rates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExchangeRateController {
    constructor(private readonly exchangeRateService: ExchangeRateService) { }

    @Get()
    async getRates(): Promise<ExchangeRateResponseDto> {
        return this.exchangeRateService.getRates();
    }

    @Put()
    @Roles(UserRole.SUPER_ADMIN)
    async updateRates(@Body() dto: UpdateExchangeRatesDto): Promise<ExchangeRateResponseDto> {
        return this.exchangeRateService.updateRates(dto);
    }
}