import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsEnum, IsBoolean } from "class-validator";

export class CreateExpenseCategoryDto {
    @ApiProperty({ example: "Alquiler" })
    @IsString()
    name: string;

    @ApiPropertyOptional({ example: "Pago de alquiler del local" })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ enum: ['fixed', 'variable'], default: 'variable' })
    @IsOptional()
    @IsEnum(['fixed', 'variable'])
    type?: 'fixed' | 'variable';
}

export class UpdateExpenseCategoryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsEnum(['fixed', 'variable'])
    type?: 'fixed' | 'variable';

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}