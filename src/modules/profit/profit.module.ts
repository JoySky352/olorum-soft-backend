import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfitService } from './services/profit.service';
import { ProfitController } from './controllers/profit.controller';
import { Sale } from '../sale/entities/sale.entity';
import { SaleItem } from '../sale/entities/sale-item.entity';
import { Expense } from '../expense/entities/expense.entity';
import { Shift } from '../shift/entities/shift.entity';
import { User } from '../user/user.entity';
import { Provider } from '../setting/entities/provider.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Sale, SaleItem, Expense, Shift, User, Provider]),
    ],
    controllers: [ProfitController],
    providers: [ProfitService],
})
export class ProfitModule { }