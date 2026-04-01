import { Injectable, ConflictException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Category } from "../entities/category.entity";
import { CreateCategoryDto, UpdateCategoryDto } from "../dto/category.dto";

@Injectable()
export class CategoryService {
    constructor(
        @InjectRepository(Category)
        private categoryRepository: Repository<Category>,
    ) { }

    async create(dto: CreateCategoryDto): Promise<Category> {
        const existing = await this.categoryRepository.findOne({
            where: { name: dto.name },
        });
        if (existing) {
            throw new ConflictException(`La categoría "${dto.name}" ya existe`);
        }
        const category = this.categoryRepository.create(dto);
        return this.categoryRepository.save(category);
    }

    async findAll(): Promise<Category[]> {
        return this.categoryRepository.find({ order: { name: 'ASC' } });
    }

    async findOne(id: number): Promise<Category> {
        const category = await this.categoryRepository.findOne({ where: { id } });
        if (!category) {
            throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
        }
        return category;
    }

    async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
        const category = await this.findOne(id);
        Object.assign(category, dto);
        return this.categoryRepository.save(category);
    }

    async remove(id: number): Promise<void> {
        const result = await this.categoryRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
        }
    }
}