import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsBoolean } from "class-validator";

export class CreateCategoryDto {
    @ApiProperty({ example: "Alimentos" })
    @IsString()
    name: string;

    @ApiPropertyOptional({ example: "Productos alimenticios" })
    @IsOptional()
    @IsString()
    description?: string;
}

export class UpdateCategoryDto {
    @ApiPropertyOptional({ example: "Bebidas" })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ example: "Bebidas alcohólicas y no alcohólicas" })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}