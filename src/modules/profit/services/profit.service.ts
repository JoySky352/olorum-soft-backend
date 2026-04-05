import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Sale } from '../../sale/entities/sale.entity';
import { SaleItem } from '../../sale/entities/sale-item.entity';
import { Expense } from '../../expense/entities/expense.entity';
import { Shift } from '../../shift/entities/shift.entity';
import { User } from '../../user/user.entity';
import { Provider } from '../../setting/entities/provider.entity';
import { CubaDateHelper } from '../../new-reports/helpers/date-helper';
import { ProfitReportDto, UserProfitDto, ProviderProfitDto } from '../dto/profit-report.dto';

@Injectable()
export class ProfitService {
    constructor(
        @InjectRepository(Sale)
        private saleRepository: Repository<Sale>,
        @InjectRepository(SaleItem)
        private saleItemRepository: Repository<SaleItem>,
        @InjectRepository(Expense)
        private expenseRepository: Repository<Expense>,
        @InjectRepository(Shift)
        private shiftRepository: Repository<Shift>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Provider)
        private providerRepository: Repository<Provider>,
    ) { }

    async getProfitReport(startDate: Date, endDate: Date): Promise<ProfitReportDto> {
        const start = CubaDateHelper.getStartOfDay(startDate);
        const end = CubaDateHelper.getEndOfDay(endDate);

        // 1. Obtener todos los items de ventas en el período (charged o partial_refund)
        const saleItems = await this.saleItemRepository
            .createQueryBuilder('item')
            .leftJoinAndSelect('item.sale', 'sale')
            .leftJoinAndSelect('item.product', 'product')
            .where('sale.created_at BETWEEN :start AND :end', { start, end })
            .andWhere('sale.status IN (:...statuses)', { statuses: ['charged', 'partial_refund'] })
            .getMany();

        // 2. Calcular ganancia bruta total y por proveedor (usando el nombre del proveedor)
        let totalGrossProfit = 0;
        const providerProfitMap = new Map<string, { id?: number; name: string; profit: number }>();

        for (const item of saleItems) {
            const quantity = Number(item.quantity) - (item.quantityRefunded || 0);
            if (quantity <= 0) continue;
            const unitPrice = Number(item.unitPrice);
            const unitCost = Number(item.product?.unitCost || 0);
            const profit = (unitPrice - unitCost) * quantity;
            totalGrossProfit += profit;

            const providerName = item.product?.investor;
            if (providerName && providerName.trim() !== '') {
                const existing = providerProfitMap.get(providerName);
                if (existing) {
                    existing.profit += profit;
                } else {
                    providerProfitMap.set(providerName, { name: providerName, profit });
                }
            }
        }

        // 3. Gastos totales
        const expenses = await this.expenseRepository.find({
            where: { expenseDate: Between(start, end) },
        });
        const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

        const netProfit = totalGrossProfit - totalExpenses;

        // 4. Obtener todos los proveedores con sus planes de utilidad (profit)
        const providers = await this.providerRepository.find({
            where: { isActive: true },
            relations: ['profitPlan'],
        });

        // Preparamos una lista de IDs de proveedores que tienen plan de utilidad activo
        const activeProfitProviders = providers.filter(p => p.profitPlan && p.profitPlan.isActive && p.profitPlan.planType === 'profit');

        // Construir el array de ProviderProfitDto
        const providerProfits: ProviderProfitDto[] = [];

        for (const provider of activeProfitProviders) {
            const plan = provider.profitPlan!;
            const profitPercentage = (plan.variablePercentage || 0);
            // Buscar la ganancia generada por este proveedor usando su nombre
            const profitGenerated = providerProfitMap.get(provider.name)?.profit || 0;
            const amount = profitGenerated * (profitPercentage / 100);

            providerProfits.push({
                providerId: provider.id,
                providerName: provider.name,
                planName: plan.name,
                profitGenerated: parseFloat(profitGenerated.toFixed(2)),
                amount: parseFloat(amount.toFixed(2)),
            });
        }

        // 5. Usuarios con planes activos (salary o profit)
        const users = await this.userRepository.find({
            where: { isActive: true },
            relations: ['salaryPlan'],
        });

        const userProfits: UserProfitDto[] = [];

        for (const user of users) {
            const plan = user.salaryPlan;
            if (!plan || !plan.isActive) continue;

            let amount = 0;
            let planType: 'salary' | 'profit' | null = null;
            let planName: string | null = plan.name;

            if (plan.planType === 'salary') {
                planType = 'salary';
                // Obtener turnos cerrados del usuario en el período
                const shifts = await this.shiftRepository.find({
                    where: {
                        userId: user.id,
                        status: 'closed',
                        closedAt: Between(start, end),
                    },
                    relations: ['sales', 'sales.items', 'sales.items.product'],
                });
                for (const shift of shifts) {
                    // Calcular ingresos totales del turno (monto real después de devoluciones)
                    const shiftIncome = shift.sales
                        .filter(s => s.status === 'charged' || s.status === 'partial_refund')
                        .reduce((sum, s) => sum + (Number(s.total) - (s.refunded || 0)), 0);
                    let salario = plan.fixedSalary || 0;
                    salario += (shiftIncome * (plan.variablePercentage || 0)) / 100;
                    if (plan.thresholdAmount && plan.extraPercentage && shiftIncome > plan.thresholdAmount) {
                        salario += (shiftIncome * plan.extraPercentage) / 100;
                    }
                    amount += salario;
                }
            } else if (plan.planType === 'profit') {
                planType = 'profit';
                const profitPercentage = (plan.variablePercentage || 0);
                amount = netProfit * (profitPercentage / 100);
            }

            userProfits.push({
                userId: user.id,
                userName: user.username,
                role: user.role,
                planName,
                planType,
                amount: parseFloat(amount.toFixed(2)),
            });
        }

        return {
            period: {
                startDate: start.toISOString(),
                endDate: end.toISOString(),
            },
            totalGrossProfit: parseFloat(totalGrossProfit.toFixed(2)),
            totalExpenses: parseFloat(totalExpenses.toFixed(2)),
            netProfit: parseFloat(netProfit.toFixed(2)),
            users: userProfits,
            providers: providerProfits,
        };
    }
}