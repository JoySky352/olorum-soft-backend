import { Module, OnModuleInit } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { User } from "./user.entity";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { SalaryModule } from "../salary/salary.module";

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([User]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: "24h" },
            }),
        }),
        SalaryModule,
    ],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService, JwtModule],
})
export class UserModule implements OnModuleInit {
    constructor(private userService: UserService) { }

    async onModuleInit() {
        await this.userService.createFirstSuperAdminIfNotExists();
    }
}