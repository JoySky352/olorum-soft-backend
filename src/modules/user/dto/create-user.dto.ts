import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "../user.entity";

export class CreateUserDto {
    @ApiProperty({
        example: "juanperez",
        description: "Nombre de usuario único",
        minLength: 3,
    })
    @IsString()
    @MinLength(3)
    username: string;

    @ApiProperty({
        example: "juan@olorunsoft.com",
        description: "Correo electrónico único",
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        example: "MiPassword123",
        description: "Contraseña (mínimo 6 caracteres)",
        minLength: 6,
    })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({
        example: UserRole.DEPENDENT,
        description: "Rol del usuario",
        enum: UserRole,
        required: false,
        default: UserRole.DEPENDENT,
    })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;
}