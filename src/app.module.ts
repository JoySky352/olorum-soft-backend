import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { SaleModule } from "./modules/sale/sale.module";
import { ProcesorModule } from "./modules/procesor/procesor.module";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { ReportModule } from "./modules/report/report.module";
import { SettingModule } from "./modules/setting/setting.module";
import { MigrationModule } from "./modules/migration/migration.module";
import { UserModule } from "./modules/user/user.module";
import { AuthModule } from "./modules/auth/auth.module";
import { NewReportsModule } from "./modules/new-reports/new-reports.module";
import { ShiftModule } from "./modules/shift/shift.module";
import { ExpenseModule } from "./modules/expense/expense.module";
import { AdvancedReportModule } from "./modules/advanced-report/advanced-report.module";
import { SalaryModule } from './modules/salary/salary.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: "better-sqlite3",
      database: "uploads/db.db",
      entities: [__dirname + "/**/*.entity{.ts,.js}"],
      synchronize: true, // en true Solo para desarrollo
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "uploads"),
    }),
    InventoryModule,
    SaleModule,
    ProcesorModule,
    ReportModule,
    SettingModule,
    MigrationModule,
    UserModule,
    AuthModule,
    NewReportsModule,
    ShiftModule,
    ExpenseModule,
    AdvancedReportModule,
    SalaryModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }