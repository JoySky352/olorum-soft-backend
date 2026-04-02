import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Expense } from "../entities/expense.entity";
import { ExpenseCategory } from "../entities/expense-category.entity";
import { CreateExpenseDto, UpdateExpenseDto, GetExpensesDto } from "../dto/expense.dto";
import { PaginatedResponseDto } from "src/core/dto/paginated-response.dto";
import * as ExcelJS from 'exceljs';

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

        // Construir la consulta base
        let query = this.expenseRepository
            .createQueryBuilder("expense")
            .leftJoinAndSelect("expense.category", "category");

        // Aplicar filtro de fechas
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query = query.where("expense.expenseDate BETWEEN :start AND :end", { start, end });
        }

        const expenses = await query.getMany();

        // Calcular totales
        let totalGastos = 0;
        let gastosFijos = 0;
        let gastosVariables = 0;
        const porCategoria: { category: string; total: number }[] = [];

        for (const expense of expenses) {
            const amount = Number(expense.amount);
            totalGastos += amount;

            // Determinar si es fijo o variable basado en el tipo de la categoría
            if (expense.category?.type === 'fixed') {
                gastosFijos += amount;
            } else {
                gastosVariables += amount;
            }
        }

        // Agrupar por categoría
        const categoriaMap = new Map<string, number>();
        for (const expense of expenses) {
            const current = categoriaMap.get(expense.categoryName) || 0;
            categoriaMap.set(expense.categoryName, current + Number(expense.amount));
        }

        for (const [category, total] of categoriaMap) {
            porCategoria.push({ category, total: parseFloat(total.toFixed(2)) });
        }

        return {
            totalGastos: parseFloat(totalGastos.toFixed(2)),
            gastosFijos: parseFloat(gastosFijos.toFixed(2)),
            gastosVariables: parseFloat(gastosVariables.toFixed(2)),
            porCategoria,
        };
    }

    async exportToExcel(dto: GetExpensesDto): Promise<Buffer> {
        const { data } = await this.findAll(dto);
        const expenses = data;
        const summary = await this.getSummary(dto);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Reporte de Gastos');

        // Título
        worksheet.mergeCells('A1:F1');
        worksheet.getCell('A1').value = 'REPORTE DE GASTOS';
        worksheet.getCell('A1').font = { size: 16, bold: true };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };

        // Fecha del reporte
        worksheet.getCell('A2').value = `Generado: ${new Date().toLocaleString('es-CU')}`;
        worksheet.getCell('A2').alignment = { horizontal: 'left' };

        // Resumen
        let row = 4;
        worksheet.getCell(`A${row}`).value = 'RESUMEN GENERAL';
        worksheet.getCell(`A${row}`).font = { bold: true };
        row++;

        worksheet.getCell(`A${row}`).value = 'Total Gastos:';
        worksheet.getCell(`B${row}`).value = summary.totalGastos;
        row++;
        worksheet.getCell(`A${row}`).value = 'Gastos Fijos:';
        worksheet.getCell(`B${row}`).value = summary.gastosFijos;
        row++;
        worksheet.getCell(`A${row}`).value = 'Gastos Variables:';
        worksheet.getCell(`B${row}`).value = summary.gastosVariables;
        row += 2;

        // Tabla de gastos
        worksheet.getCell(`A${row}`).value = 'LISTADO DE GASTOS';
        worksheet.getCell(`A${row}`).font = { bold: true };
        row++;

        const headers = ['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Monto', 'Usuario'];
        worksheet.addRow(headers);
        const headerRow = worksheet.getRow(row);
        headerRow.font = { bold: true };
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9D9D9' },
            };
        });
        row++;

        for (const expense of expenses) {
            const category = expense.category;
            const expenseDate = new Date(expense.expenseDate);
            const formattedDate = `${expenseDate.getDate().toString().padStart(2, '0')}/${(expenseDate.getMonth() + 1).toString().padStart(2, '0')}/${expenseDate.getFullYear()}`;

            worksheet.addRow([
                formattedDate,
                expense.description,
                expense.categoryName,
                category?.type === 'fixed' ? 'Fijo' : 'Variable',
                expense.amount,
                expense.userName,
            ]);
            row++;
        }

        // Ajustar columnas
        worksheet.columns.forEach(col => {
            let maxLength = 10;
            col.eachCell?.({ includeEmpty: true }, (cell) => {
                const val = cell.value ? String(cell.value) : '';
                if (val.length > maxLength) maxLength = val.length;
            });
            col.width = maxLength + 2;
        });

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
}