import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Expense } from "./entities/expense.entity";
import { ExpenseCategory } from "./entities/expense-category.entity";
import { CashWithdrawal } from "./entities/cash-withdrawal.entity";
import { ExpenseController } from "./controllers/expense.controller";
import { ExpenseCategoryController } from "./controllers/expense-category.controller";
import { CashWithdrawalController } from "./controllers/cash-withdrawal.controller";
import { ExpenseService } from "./services/expense.service";
import { ExpenseCategoryService } from "./services/expense-category.service";
import { CashWithdrawalService } from "./services/cash-withdrawal.service";
import { ShiftModule } from "../shift/shift.module";

@Module({
    imports: [TypeOrmModule.forFeature([Expense, ExpenseCategory, CashWithdrawal]), ShiftModule],
    controllers: [ExpenseController, ExpenseCategoryController, CashWithdrawalController],
    providers: [ExpenseService, ExpenseCategoryService, CashWithdrawalService],
    exports: [ExpenseService, ExpenseCategoryService, CashWithdrawalService],
})
export class ExpenseModule { }