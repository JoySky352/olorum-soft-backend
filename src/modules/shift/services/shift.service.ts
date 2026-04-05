import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Shift } from "../entities/shift.entity";
import { Sale } from "../../sale/entities/sale.entity";
import { User } from "../../user/user.entity";
import { OpenShiftDto, CloseShiftDto, GetShiftsDto, ShiftReportDto } from "../dto/shift.dto";

@Injectable()
export class ShiftService {
    constructor(
        @InjectRepository(Shift)
        private shiftRepository: Repository<Shift>,
        @InjectRepository(Sale)
        private saleRepository: Repository<Sale>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async openShift(userId: number, userName: string, dto: OpenShiftDto): Promise<Shift> {
        const openShift = await this.shiftRepository.findOne({
            where: { userId, status: "open" },
        });

        if (openShift) {
            throw new BadRequestException("Ya tienes un turno abierto. Ciérralo antes de abrir otro.");
        }

        const shift = this.shiftRepository.create({
            userId,
            userName,
            openedAt: new Date(),
            openingCash: dto.openingCash || 0,
            status: "open",
        });

        return this.shiftRepository.save(shift);
    }

    async closeShift(userId: number, shiftId: number, dto: CloseShiftDto): Promise<Shift> {
        const shift = await this.shiftRepository.findOne({
            where: { id: shiftId },
            relations: ["sales"],
        });

        if (!shift) {
            throw new NotFoundException("Turno no encontrado");
        }

        if (shift.status === "closed") {
            throw new BadRequestException("Este turno ya está cerrado");
        }

        const ventas = shift.sales.filter(s => s.status === "charged" || s.status === "partial_refund");
        const ingresosTotales = ventas.reduce((sum, s) => {
            const montoReal = Number(s.total) - (s.refunded || 0);
            return sum + montoReal;
        }, 0);

        shift.closedAt = new Date();
        shift.closingCash = dto.closingCash;
        shift.status = "closed";

        return this.shiftRepository.save(shift);
    }

    async getCurrentShift(userId: number): Promise<Shift | null> {
        return this.shiftRepository.findOne({
            where: { userId, status: "open" },
            relations: ["sales", "sales.items", "sales.items.product", "user", "user.salaryPlan"],
        });
    }

    async getShiftReport(shiftId: number): Promise<ShiftReportDto> {
        const shift = await this.shiftRepository.findOne({
            where: { id: shiftId },
            relations: ["sales", "sales.items", "sales.items.product", "user", "user.salaryPlan"],
        });

        if (!shift) {
            throw new NotFoundException("Turno no encontrado");
        }

        const ventas = shift.sales.filter(s => s.status === "charged" || s.status === "partial_refund");

        let ingresosTotales = 0;
        let gananciaTotal = 0;
        let efectivoTotal = 0;
        let transferenciaTotal = 0;
        let mixtoTotal = 0;
        let freeCostoTotal = 0;

        for (const sale of ventas) {
            const montoReal = Number(sale.total) - (sale.refunded || 0);
            if (montoReal <= 0) continue;

            ingresosTotales += montoReal;

            // Ganancia sobre el monto real
            for (const item of sale.items) {
                const cantidadNoDevuelta = item.quantity - (item.quantityRefunded || 0);
                if (cantidadNoDevuelta <= 0) continue;
                const ingreso = Number(item.unitPrice) * cantidadNoDevuelta;
                const costo = Number(item.product?.unitCost || 0) * cantidadNoDevuelta;
                gananciaTotal += ingreso - costo;
            }

            // Distribución por método de pago
            const metodo = sale.paymentMethod;
            if (metodo === "Efectivo" || metodo === "USD" || metodo === "EUR") {
                efectivoTotal += montoReal;
            } else if (metodo === "Transferencia") {
                transferenciaTotal += montoReal;
            } else if (metodo === "Mixto") {
                const totalOriginal = Number(sale.total);
                const efectivoOriginal = Number(sale.efectivoAmount || 0);
                const transferenciaOriginal = Number(sale.transferenciaAmount || 0);
                if (totalOriginal > 0 && montoReal > 0) {
                    const efectivoReal = (montoReal * efectivoOriginal) / totalOriginal;
                    const transferenciaReal = (montoReal * transferenciaOriginal) / totalOriginal;
                    efectivoTotal += efectivoReal;
                    transferenciaTotal += transferenciaReal;
                }
                mixtoTotal += montoReal;
            } else if (metodo === "Free") {
                for (const item of sale.items) {
                    const cantidadNoDevuelta = item.quantity - (item.quantityRefunded || 0);
                    if (cantidadNoDevuelta <= 0) continue;
                    const costo = Number(item.product?.unitCost || 0) * cantidadNoDevuelta;
                    freeCostoTotal += costo;
                }
            }
        }

        let salario = 0;
        if (shift.user?.salaryPlan) {
            const plan = shift.user.salaryPlan;
            const variable = (ingresosTotales * (plan.variablePercentage || 0)) / 100;
            salario = plan.fixedSalary + variable;
        }

        return {
            id: shift.id,
            userName: shift.userName,
            openedAt: shift.openedAt.toISOString(),
            closedAt: shift.closedAt?.toISOString() || null,
            openingCash: shift.openingCash,
            closingCash: shift.closingCash,
            status: shift.status,
            totalVentas: ventas.length,
            ingresosTotales: parseFloat(ingresosTotales.toFixed(2)),
            gananciaTotal: parseFloat(gananciaTotal.toFixed(2)),
            ventasPorMetodoPago: {
                efectivo: parseFloat(efectivoTotal.toFixed(2)),
                transferencia: parseFloat(transferenciaTotal.toFixed(2)),
                mixto: parseFloat(mixtoTotal.toFixed(2)),
                free: parseFloat(freeCostoTotal.toFixed(2)),
            },
            salario: parseFloat(salario.toFixed(2)),
        };
    }

async getShiftsReport(dto: GetShiftsDto): Promise<{ shifts: ShiftReportDto[]; total: number }> {
    const { limit = 50, offset = 0, startDate, endDate, userId } = dto;

    const query = this.shiftRepository
        .createQueryBuilder("shift")
        .leftJoinAndSelect("shift.sales", "sale")
        .leftJoinAndSelect("sale.items", "item")
        .leftJoinAndSelect("item.product", "product")
        .leftJoinAndSelect("shift.user", "user")               // 👈 cargar usuario
        .leftJoinAndSelect("user.salaryPlan", "salaryPlan")    // 👈 cargar plan de salario
        .orderBy("shift.opened_at", "DESC");

    if (userId) {
        query.andWhere("shift.user_id = :userId", { userId });
    }

    if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.andWhere("shift.opened_at BETWEEN :start AND :end", { start, end });
    }

    const [shifts, total] = await query.getManyAndCount();

    const shiftReports = shifts.map(shift => {
        const ventas = shift.sales.filter(s => s.status === "charged" || s.status === "partial_refund");

        let ingresosTotales = 0;
        let gananciaTotal = 0;
        let efectivoTotal = 0;
        let transferenciaTotal = 0;
        let mixtoTotal = 0;
        let freeCostoTotal = 0;

        for (const sale of ventas) {
            const montoReal = Number(sale.total) - (sale.refunded || 0);
            if (montoReal <= 0) continue;

            ingresosTotales += montoReal;

            for (const item of sale.items) {
                const cantidadNoDevuelta = item.quantity - (item.quantityRefunded || 0);
                if (cantidadNoDevuelta <= 0) continue;
                const ingreso = Number(item.unitPrice) * cantidadNoDevuelta;
                const costo = Number(item.product?.unitCost || 0) * cantidadNoDevuelta;
                gananciaTotal += ingreso - costo;
            }

            const metodo = sale.paymentMethod;
            if (metodo === "Efectivo" || metodo === "USD" || metodo === "EUR") {
                efectivoTotal += montoReal;
            } else if (metodo === "Transferencia") {
                transferenciaTotal += montoReal;
            } else if (metodo === "Mixto") {
                const totalOriginal = Number(sale.total);
                const efectivoOriginal = Number(sale.efectivoAmount || 0);
                const transferenciaOriginal = Number(sale.transferenciaAmount || 0);
                if (totalOriginal > 0 && montoReal > 0) {
                    const efectivoReal = (montoReal * efectivoOriginal) / totalOriginal;
                    const transferenciaReal = (montoReal * transferenciaOriginal) / totalOriginal;
                    efectivoTotal += efectivoReal;
                    transferenciaTotal += transferenciaReal;
                }
                mixtoTotal += montoReal;
            } else if (metodo === "Free") {
                for (const item of sale.items) {
                    const cantidadNoDevuelta = item.quantity - (item.quantityRefunded || 0);
                    if (cantidadNoDevuelta <= 0) continue;
                    const costo = Number(item.product?.unitCost || 0) * cantidadNoDevuelta;
                    freeCostoTotal += costo;
                }
            }
        }

        // Calcular salario según plan del usuario
        let salario = 0;
        if (shift.user?.salaryPlan) {
            const plan = shift.user.salaryPlan;
            const variable = (ingresosTotales * (plan.variablePercentage || 0)) / 100;
            salario = plan.fixedSalary + variable;
        }

        return {
            id: shift.id,
            userName: shift.userName,
            openedAt: shift.openedAt.toISOString(),
            closedAt: shift.closedAt?.toISOString() || null,
            openingCash: shift.openingCash,
            closingCash: shift.closingCash,
            status: shift.status,
            totalVentas: ventas.length,
            ingresosTotales: parseFloat(ingresosTotales.toFixed(2)),
            gananciaTotal: parseFloat(gananciaTotal.toFixed(2)),
            ventasPorMetodoPago: {
                efectivo: parseFloat(efectivoTotal.toFixed(2)),
                transferencia: parseFloat(transferenciaTotal.toFixed(2)),
                mixto: parseFloat(mixtoTotal.toFixed(2)),
                free: parseFloat(freeCostoTotal.toFixed(2)),
            },
            salario: parseFloat(salario.toFixed(2)),   // 👈 añadir salario
        };
    });

    return { shifts: shiftReports.slice(offset, offset + limit), total };
}
}