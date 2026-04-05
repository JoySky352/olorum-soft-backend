import { IsString, IsNumber, Min, IsOptional, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSalaryPlanDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsNumber()
    @Min(0)
    fixedSalary: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    variablePercentage?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    thresholdAmount?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    extraPercentage?: number;
}