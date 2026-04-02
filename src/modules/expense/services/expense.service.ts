import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Expense } from "../entities/expense.entity";
import { ExpenseCategory } from "../entities/expense-category.entity";
import { CreateExpenseDto, UpdateExpenseDto, GetExpensesDto } from "../dto/expense.dto";
import { PaginatedResponseDto } from "src/core/dto/paginated-response.dto";

@Injectable()
export class ExpenseService {
    constructor(
        @InjectRepository(Expense)
        private expenseRepository: Repository<Expense>,
        @InjectRepository(ExpenseCategory)
        private categoryRepository: Repository<ExpenseCategory>,
    ) { }

    async create(dto: CreateExpenseDto, userId: number, userName: string, shiftId?: number): Promise<Expense> {
        const category = await this.categoryRepository.findOne({ where: { id: dto.categoryId } });
        if (!category) {
            throw new NotFoundException(`Categoría con ID ${dto.categoryId} no encontrada`);
        }

        const expense = new Expense();
        expense.description = dto.description;
        expense.amount = dto.amount;
        expense.categoryId = dto.categoryId;
        expense.categoryName = category.name;
        expense.expenseDate = dto.expenseDate;
        expense.notes = dto.notes || null;
        expense.userId = userId;
        expense.userName = userName;
        expense.shiftId = shiftId || null;

        return this.expenseRepository.save(expense);
    }

    async findAll(dto: GetExpensesDto): Promise<PaginatedResponseDto<Expense>> {
        const { limit = 10, offset = 0, startDate, endDate, categoryId, type } = dto;

        const query = this.expenseRepository
            .createQueryBuilder("expense")
            .leftJoinAndSelect("expense.category", "category")
            .orderBy("expense.expenseDate", "DESC")
            .skip(offset)
            .take(limit);

        if (categoryId) {
            query.andWhere("expense.categoryId = :categoryId", { categoryId });
        }

        if (type) {
            query.andWhere("category.type = :type", { type });
        }

        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.andWhere("expense.expenseDate BETWEEN :start AND :end", { start, end });
        }

        const [data, total] = await query.getManyAndCount();
        return new PaginatedResponseDto(data, total, limit, offset);
    }

    async findOne(id: number): Promise<Expense> {
        const expense = await this.expenseRepository.findOne({
            where: { id },
            relations: ["category"],
        });
        if (!expense) {
            throw new NotFoundException(`Gasto con ID ${id} no encontrado`);
        }
        return expense;
    }

    async update(id: number, dto: UpdateExpenseDto): Promise<Expense> {
        const expense = await this.findOne(id);

        if (dto.categoryId && dto.categoryId !== expense.categoryId) {
            const category = await this.categoryRepository.findOne({ where: { id: dto.categoryId } });
            if (!category) {
                throw new NotFoundException(`Categoría con ID ${dto.categoryId} no encontrada`);
            }
            expense.categoryName = category.name;
        }

        if (dto.description !== undefined) expense.description = dto.description;
        if (dto.amount !== undefined) expense.amount = dto.amount;
        if (dto.categoryId !== undefined) expense.categoryId = dto.categoryId;
        if (dto.expenseDate !== undefined) expense.expenseDate = dto.expenseDate;
        if (dto.notes !== undefined) expense.notes = dto.notes;

        return this.expenseRepository.save(expense);
    }

    async remove(id: number): Promise<void> {
        const result = await this.expenseRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Gasto con ID ${id} no encontrado`);
        }
    }

    async getSummary(dto: GetExpensesDto): Promise<{
        totalGastos: number;
        gastosFijos: number;
        gastosVariables: number;
        porCategoria: { category: string; total: number }[];
    }> {
        const { startDate, endDate } = dto;

        const query = this.expenseRepository
            .createQueryBuilder("expense")
            .leftJoin("expense.category", "category");

        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.where("expense.expenseDate BETWEEN :start AND :end", { start, end });
        }

        const expenses = await query.getMany();

        const totalGastos = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const gastosFijos = expenses
            .filter(e => e.category?.type === 'fixed')
            .reduce((sum, e) => sum + Number(e.amount), 0);
        const gastosVariables = expenses
            .filter(e => e.category?.type === 'variable')
            .reduce((sum, e) => sum + Number(e.amount), 0);

        const porCategoriaMap = new Map<string, number>();
        for (const expense of expenses) {
            const current = porCategoriaMap.get(expense.categoryName) || 0;
            porCategoriaMap.set(expense.categoryName, current + Number(expense.amount));
        }

        const porCategoria = Array.from(porCategoriaMap.entries()).map(([category, total]) => ({
            category,
            total: parseFloat(total.toFixed(2)),
        }));

        return {
            totalGastos: parseFloat(totalGastos.toFixed(2)),
            gastosFijos: parseFloat(gastosFijos.toFixed(2)),
            gastosVariables: parseFloat(gastosVariables.toFixed(2)),
            porCategoria,
        };
    }
}