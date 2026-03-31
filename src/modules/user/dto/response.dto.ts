import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "../user.entity";

export class UserResponseDto {
    @ApiProperty({
        example: 1,
        description: "ID del usuario",
    })
    id: number;

    @ApiProperty({
        example: "juanperez",
        description: "Nombre de usuario",
    })
    username: string;

    @ApiProperty({
        example: "juan@olorunsoft.com",
        description: "Correo electrónico",
    })
    email: string;

    @ApiProperty({
        example: UserRole.DEPENDENT,
        description: "Rol del usuario",
        enum: UserRole,
    })
    role: UserRole;

    @ApiProperty({
        example: true,
        description: "Estado activo/inactivo",
    })
    isActive: boolean;

    @ApiProperty({
        example: "2024-01-15T10:30:00.000Z",
        description: "Fecha de creación",
    })
    createdAt: Date;

    @ApiProperty({
        example: "2024-01-15T10:30:00.000Z",
        description: "Fecha de última actualización",
    })
    updatedAt: Date;
}

export class LoginResponseDto {
    @ApiProperty({
        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        description: "Token JWT de acceso",
    })
    accessToken: string;

    @ApiProperty({
        description: "Datos del usuario autenticado",
        type: UserResponseDto,
    })
    user: UserResponseDto;
}