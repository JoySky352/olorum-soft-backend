import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsBoolean, IsEmail, IsNumber } from "class-validator";

export class CreateProviderDto {
    @ApiProperty({ example: "Cervecería Bucanero" })
    @IsString()
    name: string;

    @ApiPropertyOptional({ example: "Juan Pérez" })
    @IsOptional()
    @IsString()
    contactName?: string;

    @ApiPropertyOptional({ example: "+53 5555-5555" })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ example: "contacto@bucanero.com" })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({ example: "La Habana, Cuba" })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional({ description: "ID del plan de utilidad (profit) para este proveedor" })
    @IsOptional()
    @IsNumber()
    profitPlanId?: number;
}

export class UpdateProviderDto {
    @ApiPropertyOptional({ example: "Cervecería Bucanero" })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ example: "Juan Pérez" })
    @IsOptional()
    @IsString()
    contactName?: string;

    @ApiPropertyOptional({ example: "+53 5555-5555" })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ example: "contacto@bucanero.com" })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({ example: "La Habana, Cuba" })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({ description: "ID del plan de utilidad (profit) para este proveedor" })
    @IsOptional()
    @IsNumber()
    profitPlanId?: number;
}