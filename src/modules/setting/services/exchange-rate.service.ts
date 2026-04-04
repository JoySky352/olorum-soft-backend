// src/modules/setting/services/exchange-rate.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExchangeRate } from '../entities/exchange-rate.entity';
import { UpdateExchangeRatesDto, ExchangeRateResponseDto } from '../dto/exchange-rate.dto';

@Injectable()
export class ExchangeRateService {
    constructor(
        @InjectRepository(ExchangeRate)
        private exchangeRateRepository: Repository<ExchangeRate>,
    ) { }

    async getRates(): Promise<ExchangeRateResponseDto> {
        let usd = await this.exchangeRateRepository.findOne({ where: { key: 'USD' } });
        let eur = await this.exchangeRateRepository.findOne({ where: { key: 'EUR' } });

        if (!usd) {
            usd = this.exchangeRateRepository.create({ key: 'USD', value: 320 });
            await this.exchangeRateRepository.save(usd);
        }
        if (!eur) {
            eur = this.exchangeRateRepository.create({ key: 'EUR', value: 350 });
            await this.exchangeRateRepository.save(eur);
        }

        return { usdRate: usd.value, eurRate: eur.value };
    }

    async updateRates(dto: UpdateExchangeRatesDto): Promise<ExchangeRateResponseDto> {
        let usd = await this.exchangeRateRepository.findOne({ where: { key: 'USD' } });
        let eur = await this.exchangeRateRepository.findOne({ where: { key: 'EUR' } });

        if (!usd) {
            usd = this.exchangeRateRepository.create({ key: 'USD', value: dto.usdRate });
        } else {
            usd.value = dto.usdRate;
        }
        if (!eur) {
            eur = this.exchangeRateRepository.create({ key: 'EUR', value: dto.eurRate });
        } else {
            eur.value = dto.eurRate;
        }

        await this.exchangeRateRepository.save([usd, eur]);
        return { usdRate: usd.value, eurRate: eur.value };
    }
}