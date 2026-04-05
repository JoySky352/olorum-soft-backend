import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalaryPlan } from '../entities/salary-plan.entity';
import { CreateSalaryPlanDto, UpdateSalaryPlanDto } from '../dto';

@Injectable()
export class SalaryPlanService {
    constructor(
        @InjectRepository(SalaryPlan)
        private salaryPlanRepository: Repository<SalaryPlan>,
    ) { }

    async create(dto: CreateSalaryPlanDto): Promise<SalaryPlan> {
        const plan = this.salaryPlanRepository.create(dto);
        return await this.salaryPlanRepository.save(plan);
    }

    async findAll(): Promise<SalaryPlan[]> {
        return this.salaryPlanRepository.find({ where: { isActive: true } });
    }

    async findOne(id: number): Promise<SalaryPlan> {
        const plan = await this.salaryPlanRepository.findOne({ where: { id } });
        if (!plan) throw new NotFoundException(`Salary plan with ID ${id} not found`);
        return plan;
    }

    async update(id: number, dto: UpdateSalaryPlanDto): Promise<SalaryPlan> {
        const plan = await this.findOne(id);
        Object.assign(plan, dto);
        return this.salaryPlanRepository.save(plan);
    }

    async remove(id: number): Promise<void> {
        const result = await this.salaryPlanRepository.delete(id);
        if (result.affected === 0) throw new NotFoundException(`Salary plan with ID ${id} not found`);
    }
}