import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Shift } from "./entities/shift.entity";
import { ShiftController } from "./controllers/shift.controller";
import { ShiftService } from "./services/shift.service";
import { Sale } from "../sale/entities/sale.entity";
import { User } from "../user/user.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Shift, Sale, User])],
    controllers: [ShiftController],
    providers: [ShiftService],
    exports: [ShiftService],
})
export class ShiftModule { }