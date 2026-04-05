import { IsString, IsNumber, Min, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { PlanType } from '../entities/salary-plan.entity';

export class CreateSalaryPlanDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedSalary?: number | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  variablePercentage?: number | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  thresholdAmount?: number | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  extraPercentage?: number | null;

  @ApiProperty({ enum: ['salary', 'profit'], default: 'salary' })
  @IsOptional()
  @IsEnum(['salary', 'profit'])
  planType?: PlanType;
}