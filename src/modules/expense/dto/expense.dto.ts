import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNumber, IsOptional, IsDate, Min } from "class-validator";
import { Type } from "class-transformer";

export class CreateExpenseDto {
    @ApiProperty({ example: "Compra de suministros" })
    @IsString()
    description: string;

    @ApiProperty({ example: 150.00 })
    @IsNumber()
    @Min(0.01)
    amount: number;

    @ApiProperty({ example: 1 })
    @IsNumber()
    categoryId: number;

    @ApiProperty({ example: "2024-01-15" })
    @Type(() => Date)
    @IsDate()
    expenseDate: Date;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdateExpenseDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(0.01)
    amount?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    categoryId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    expenseDate?: Date;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;
}

export class GetExpensesDto {
    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    startDate?: Date;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    endDate?: Date;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    categoryId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    type?: 'fixed' | 'variable';

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    limit?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    offset?: number;
}