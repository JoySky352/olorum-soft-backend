import { Module, OnModuleInit } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { User } from "./user.entity";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        JwtModule.register({
            secret: process.env.JWT_SECRET || "olorunsoft-secret-key-change-in-production",
            signOptions: { expiresIn: "24h" },
        }),
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