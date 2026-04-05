import { PartialType } from '@nestjs/swagger';
import { CreateSalaryPlanDto } from './create-salary-plan.dto';

export class UpdateSalaryPlanDto extends PartialType(CreateSalaryPlanDto) {
    isActive?: boolean;
}