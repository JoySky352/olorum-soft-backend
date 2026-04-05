import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalaryPlan } from './entities/salary-plan.entity';
import { SalaryPlanService } from './services/salary-plan.service';
import { SalaryPlanController } from './controllers/salary-plan.controller';

@Module({
    imports: [TypeOrmModule.forFeature([SalaryPlan])],
    controllers: [SalaryPlanController],
    providers: [SalaryPlanService],
    exports: [SalaryPlanService],
})
export class SalaryModule { }