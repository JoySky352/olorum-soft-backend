import { Injectable, ConflictException, NotFoundException, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User, UserRole, UserWithoutPassword } from "./user.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { JwtService } from "@nestjs/jwt";
import { SalaryPlanService } from "../salary/services/salary-plan.service";

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private jwtService: JwtService,
        private salaryPlanService: SalaryPlanService,
    ) { }

    private mapToUserWithoutPassword(user: User): UserWithoutPassword {
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            salaryPlanId: user.salaryPlan?.id || null, // 👈 agregar
        };
    }

    async create(createUserDto: CreateUserDto): Promise<UserWithoutPassword> {
        const existingUser = await this.userRepository.findOne({
            where: [{ username: createUserDto.username }, { email: createUserDto.email }],
        });
        if (existingUser) {
            throw new ConflictException("Username or email already exists");
        }
        const user = this.userRepository.create(createUserDto);
        if (createUserDto.salaryPlanId) {
            const plan = await this.salaryPlanService.findOne(createUserDto.salaryPlanId);
            user.salaryPlan = plan;
        }
        await this.userRepository.save(user);
        return this.mapToUserWithoutPassword(user);
    }

    async findAll(): Promise<UserWithoutPassword[]> {
        // Cargar la relación salaryPlan
        const users = await this.userRepository.find({ relations: ['salaryPlan'] });
        return users.map(user => this.mapToUserWithoutPassword(user));
    }

    async findOne(id: number): Promise<UserWithoutPassword> {
        const user = await this.userRepository.findOne({ where: { id }, relations: ['salaryPlan'] });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return this.mapToUserWithoutPassword(user);
    }

    async update(id: number, updateUserDto: UpdateUserDto): Promise<UserWithoutPassword> {
        const user = await this.userRepository.findOne({ where: { id }, relations: ['salaryPlan'] });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        if (updateUserDto.salaryPlanId !== undefined) {
            const plan = await this.salaryPlanService.findOne(updateUserDto.salaryPlanId);
            user.salaryPlan = plan;
        }
        Object.assign(user, updateUserDto);
        await this.userRepository.save(user);
        return this.mapToUserWithoutPassword(user);
    }

    async remove(id: number): Promise<void> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        // Si es super admin, verificar que no sea el último
        if (user.role === UserRole.SUPER_ADMIN) {
            const superAdminCount = await this.userRepository.count({
                where: { role: UserRole.SUPER_ADMIN, isActive: true }
            });

            if (superAdminCount === 1) {
                throw new BadRequestException('No se puede eliminar el último Super Administrador');
            }
        }

        const result = await this.userRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
    }

    async login(username: string, password: string): Promise<{ accessToken: string; user: UserWithoutPassword }> {
        const user = await this.userRepository.findOne({ where: { username } });

        if (!user || !user.isActive) {
            throw new UnauthorizedException("Credenciales inválidas");
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new UnauthorizedException("Credenciales inválidas");
        }

        // Payload debe contener sub (subject) que es el ID del usuario
        const payload = {
            sub: user.id,
            username: user.username,
            role: user.role
        };

        const accessToken = this.jwtService.sign(payload);

        return {
            accessToken,
            user: this.mapToUserWithoutPassword(user)
        };
    }

    async createFirstSuperAdminIfNotExists() {
        const superAdminExists = await this.userRepository.findOne({
            where: { role: UserRole.SUPER_ADMIN },
        });

        if (!superAdminExists) {
            const superAdmin = this.userRepository.create({
                username: "superadmin",
                email: "superadmin@olorunsoft.com",
                password: "1234qwerasdf",
                role: UserRole.SUPER_ADMIN,
                isActive: true,
            });
            await this.userRepository.save(superAdmin);
        }
    }
}