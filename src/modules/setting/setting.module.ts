import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Category } from "./entities/category.entity";
import { Provider } from "./entities/provider.entity";
import { Theme } from "./entities/theme.entity"; // Agregar Theme
import { CategoryService } from "./services/category.service";
import { ProviderService } from "./services/provider.service";
import { ThemeService } from "./services/theme.service"; // Agregar ThemeService
import { CategoryController } from "./controllers/category.controller";
import { ProviderController } from "./controllers/provider.controller";
import { ThemeController } from "./controllers/theme.controller";
import { ExchangeRate } from './entities/exchange-rate.entity';
import { ExchangeRateService } from './services/exchange-rate.service';
import { ExchangeRateController } from './controllers/exchange-rate.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Provider, Theme, ExchangeRate])],
  controllers: [CategoryController, ProviderController, ThemeController, ExchangeRateController],
  providers: [CategoryService, ProviderService, ThemeService, ExchangeRateService],
  exports: [CategoryService, ProviderService, ThemeService],
})
export class SettingModule { }