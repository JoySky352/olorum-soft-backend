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

@Module({
  imports: [TypeOrmModule.forFeature([Category, Provider, Theme])], // Agregar Theme aquí
  controllers: [CategoryController, ProviderController, ThemeController], // ThemeController va aquí, no en providers
  providers: [CategoryService, ProviderService, ThemeService], // ThemeService va aquí
  exports: [CategoryService, ProviderService, ThemeService], // Exportar servicios si otros módulos los necesitan
})
export class SettingModule { }