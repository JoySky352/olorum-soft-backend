import { Controller, Get, Post, Body, Patch, Param, Delete } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { UserService } from "./user.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { LoginDto } from "./dto/login.dto";
import { UserResponseDto, LoginResponseDto } from "./dto/response.dto";

@ApiTags("users")
@Controller("users")
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Post()
    @ApiOperation({ summary: "Crear un nuevo usuario" })
    @ApiResponse({ status: 201, description: "Usuario creado exitosamente", type: UserResponseDto })
    @ApiResponse({ status: 409, description: "Usuario o email ya existe" })
    create(@Body() createUserDto: CreateUserDto) {
        return this.userService.create(createUserDto);
    }

    @Get()
    @ApiOperation({ summary: "Obtener todos los usuarios" })
    @ApiResponse({ status: 200, description: "Lista de usuarios", type: [UserResponseDto] })
    findAll() {
        return this.userService.findAll();
    }

    @Get(":id")
    @ApiOperation({ summary: "Obtener un usuario por ID" })
    @ApiResponse({ status: 200, description: "Usuario encontrado", type: UserResponseDto })
    @ApiResponse({ status: 404, description: "Usuario no encontrado" })
    findOne(@Param("id") id: string) {
        return this.userService.findOne(+id);
    }

    @Patch(":id")
    @ApiOperation({ summary: "Actualizar un usuario" })
    @ApiResponse({ status: 200, description: "Usuario actualizado", type: UserResponseDto })
    @ApiResponse({ status: 404, description: "Usuario no encontrado" })
    update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.userService.update(+id, updateUserDto);
    }

    @Delete(":id")
    @ApiOperation({ summary: "Eliminar un usuario" })
    @ApiResponse({ status: 200, description: "Usuario eliminado" })
    @ApiResponse({ status: 404, description: "Usuario no encontrado" })
    @ApiResponse({ status: 400, description: "No se puede eliminar el último Super Administrador" })
    remove(@Param("id") id: string) {
        return this.userService.remove(+id);
    }

    @Post("login")
    @ApiOperation({ summary: "Autenticar usuario" })
    @ApiResponse({ status: 200, description: "Login exitoso", type: LoginResponseDto })
    @ApiResponse({ status: 401, description: "Credenciales inválidas" })
    login(@Body() loginDto: LoginDto) {
        return this.userService.login(loginDto.username, loginDto.password);
    }
}