import { IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
    @ApiProperty({
        example: "juanperez",
        description: "Nombre de usuario",
    })
    @IsString()
    username: string;

    @ApiProperty({
        example: "MiPassword123",
        description: "Contraseña",
        minLength: 6,
    })
    @IsString()
    @MinLength(6)
    password: string;
}