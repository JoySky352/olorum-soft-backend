import { Injectable, ConflictException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ExpenseCategory } from "../entities/expense-category.entity";
import { CreateExpenseCategoryDto, UpdateExpenseCategoryDto } from "../dto/expense-category.dto";

@Injectable()
export class ExpenseCategoryService {
    constructor(
        @InjectRepository(ExpenseCategory)
        private categoryRepository: Repository<ExpenseCategory>,
    ) { }

    async create(dto: CreateExpenseCategoryDto): Promise<ExpenseCategory> {
        const existing = await this.categoryRepository.findOne({
            where: { name: dto.name },
        });
        if (existing) {
            throw new ConflictException(`La categoría "${dto.name}" ya existe`);
        }
        const category = this.categoryRepository.create({
            ...dto,
            type: dto.type || 'variable',
        });
        return this.categoryRepository.save(category);
    }

    async findAll(): Promise<ExpenseCategory[]> {
        return this.categoryRepository.find({ order: { name: 'ASC' } });
    }

    async findOne(id: number): Promise<ExpenseCategory> {
        const category = await this.categoryRepository.findOne({ where: { id } });
        if (!category) {
            throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
        }
        return category;
    }

    async update(id: number, dto: UpdateExpenseCategoryDto): Promise<ExpenseCategory> {
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