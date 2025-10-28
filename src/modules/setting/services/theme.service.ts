import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Theme } from '../entities/theme.entity';
import { Repository } from 'typeorm';
import { CreateThemeDto } from '../dto/create-theme.dto';

@Injectable()
export class ThemeService {
  constructor(
    @InjectRepository(Theme)
    private readonly themeRepository: Repository<Theme>,
  ) {}

  async getFirst() {
    return this.themeRepository.findOne({ where: {} });
  }

  async create(dto: CreateThemeDto) {
    const theme = this.themeRepository.create(dto);
    return this.themeRepository.save(theme);
  }

  async update(id: number, dto: CreateThemeDto): Promise<void> {
    const data = await this.themeRepository.update(id, dto);
    if (!data.affected)
      throw new NotFoundException(`Tema con ID ${id} no se pudo editar`);
  }
}
