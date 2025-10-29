import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateThemeDto } from "../dto/create-theme.dto";
import { UpdateThemeDto } from "../dto/update-theme.dto";
import { Theme } from "../entities/theme.entity";

// services/theme.service.ts
@Injectable()
export class ThemeService {
  constructor(
    @InjectRepository(Theme)
    private readonly themeRepository: Repository<Theme>
  ) {}

  async getActiveTheme(): Promise<Theme> {
    let theme = await this.themeRepository.findOne({ where: {} });

    if (!theme) {
      const defaultTheme = this.themeRepository.create({
        primaryColor: "#1677ff",
        secondaryColor: "#0ea5a4",
        background: "#ffffff",
        textColor: "#111827",
        surface: "#f3f4f6",
        borderColor: "#e5e7eb",
        borderRadius: "8px",
        fontFamily: "Inter, sans-serif",
        darkMode: false,
        menuColor: "#001529",
        menuTextColor: "#ffffff",
      });
      theme = await this.themeRepository.save(defaultTheme);
    }

    return theme;
  }

  async getById(id: number): Promise<Theme> {
    const theme = await this.themeRepository.findOne({ where: { id } });
    if (!theme) {
      throw new NotFoundException(`Tema ${id} no encontrado`);
    }
    return theme;
  }

  async create(dto: CreateThemeDto): Promise<Theme> {
    const theme = this.themeRepository.create(dto);
    return this.themeRepository.save(theme);
  }

  async update(id: number, dto: UpdateThemeDto): Promise<Theme> {
    const theme = await this.getById(id);
    Object.assign(theme, dto);
    return this.themeRepository.save(theme);
  }

  async patch(id: number, partial: Partial<UpdateThemeDto>): Promise<Theme> {
    const theme = await this.getById(id);
    Object.assign(theme, partial);
    return this.themeRepository.save(theme);
  }

  async delete(id: number): Promise<void> {
    const theme = await this.getById(id);
    await this.themeRepository.remove(theme);
  }
}