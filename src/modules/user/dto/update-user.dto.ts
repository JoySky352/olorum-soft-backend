import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "../user.entity";

export class UpdateUserDto {
    @ApiProperty({
        example: "juanperez_actualizado",
        description: "Nombre de usuario único",
        minLength: 3,
        required: false,
    })
    @IsOptional()
    @IsString()
    @MinLength(3)
    username?: string;

    @ApiProperty({
        example: "juan.actualizado@olorunsoft.com",
        description: "Correo electrónico único",
        required: false,
    })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({
        example: "NuevaPassword123",
        description: "Contraseña (mínimo 6 caracteres)",
        minLength: 6,
        required: false,
    })
    @IsOptional()
    @IsString()
    @MinLength(6)
    password?: string;

    @ApiProperty({
        example: UserRole.SELF_ADMIN,
        description: "Rol del usuario",
        enum: UserRole,
        required: false,
    })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @ApiProperty({
        example: true,
        description: "Estado activo/inactivo del usuario",
        required: false,
    })
    @IsOptional()
    isActive?: boolean;
}