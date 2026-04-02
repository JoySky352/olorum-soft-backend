import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Expense } from "./entities/expense.entity";
import { ExpenseCategory } from "./entities/expense-category.entity";
import { ExpenseController } from "./controllers/expense.controller";
import { ExpenseCategoryController } from "./controllers/expense-category.controller";
import { ExpenseService } from "./services/expense.service";
import { ExpenseCategoryService } from "./services/expense-category.service";
import { ShiftModule } from "../shift/shift.module";

@Module({
    imports: [TypeOrmModule.forFeature([Expense, ExpenseCategory]), ShiftModule],
    controllers: [ExpenseController, ExpenseCategoryController],
    providers: [ExpenseService, ExpenseCategoryService],
    exports: [ExpenseService, ExpenseCategoryService],
})
export class ExpenseModule { }