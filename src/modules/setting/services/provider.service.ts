import { Injectable, ConflictException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Provider } from "../entities/provider.entity";
import { CreateProviderDto, UpdateProviderDto } from "../dto/provider.dto";
import { SalaryPlan } from "../../salary/entities/salary-plan.entity";

@Injectable()
export class ProviderService {
    constructor(
        @InjectRepository(Provider)
        private providerRepository: Repository<Provider>,
        @InjectRepository(SalaryPlan)
        private salaryPlanRepository: Repository<SalaryPlan>,
    ) { }

    async create(dto: CreateProviderDto): Promise<Provider> {
        const existing = await this.providerRepository.findOne({
            where: { name: dto.name },
        });
        if (existing) {
            throw new ConflictException(`El proveedor "${dto.name}" ya existe`);
        }
        const provider = this.providerRepository.create(dto);
        if (dto.profitPlanId) {
            const plan = await this.salaryPlanRepository.findOne({ where: { id: dto.profitPlanId, planType: 'profit' } });
            if (plan) {
                provider.profitPlan = plan;
                provider.profitPlanId = plan.id;
            }
        }
        return this.providerRepository.save(provider);
    }

    async findAll(): Promise<Provider[]> {
        return this.providerRepository.find({
            order: { name: 'ASC' },
            relations: ['profitPlan'],
        });
    }

    async findOne(id: number): Promise<Provider> {
        const provider = await this.providerRepository.findOne({
            where: { id },
            relations: ['profitPlan'],
        });
        if (!provider) {
            throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
        }
        return provider;
    }

    async update(id: number, dto: UpdateProviderDto): Promise<Provider> {
        const provider = await this.findOne(id);
        Object.assign(provider, dto);
        if (dto.profitPlanId !== undefined) {
            if (dto.profitPlanId === null) {
                provider.profitPlan = null;
                provider.profitPlanId = null;
            } else {
                const plan = await this.salaryPlanRepository.findOne({ where: { id: dto.profitPlanId, planType: 'profit' } });
                if (plan) {
                    provider.profitPlan = plan;
                    provider.profitPlanId = plan.id;
                }
            }
        }
        return this.providerRepository.save(provider);
    }

    async remove(id: number): Promise<void> {
        const result = await this.providerRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
        }
    }
}