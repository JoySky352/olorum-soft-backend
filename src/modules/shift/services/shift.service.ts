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
        // Verificar si el usuario tiene un turno abierto
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

        // Calcular total de ventas del turno
        const ventas = shift.sales.filter(s => s.status === "charged");
        const ingresosTotales = ventas.reduce((sum, s) => sum + Number(s.total), 0);

        shift.closedAt = new Date();
        shift.closingCash = dto.closingCash;
        shift.status = "closed";

        return this.shiftRepository.save(shift);
    }

    async getCurrentShift(userId: number): Promise<Shift | null> {
        return this.shiftRepository.findOne({
            where: { userId, status: "open" },
            relations: ["sales", "sales.items", "sales.items.product"],
        });
    }

    async getShiftReport(shiftId: number): Promise<ShiftReportDto> {
        const shift = await this.shiftRepository.findOne({
            where: { id: shiftId },
            relations: ["sales", "sales.items", "sales.items.product"],
        });

        if (!shift) {
            throw new NotFoundException("Turno no encontrado");
        }

        const ventas = shift.sales.filter(s => s.status === "charged");
        const ingresosTotales = ventas.reduce((sum, s) => sum + Number(s.total), 0);

        const gananciaTotal = ventas.reduce((acc, s) => {
            return acc + s.items.reduce((sum, item) => {
                const ingreso = Number(item.unitPrice) * Number(item.quantity);
                const costo = Number(item.product?.unitCost || 0) * Number(item.quantity);
                return sum + (ingreso - costo);
            }, 0);
        }, 0);

        const ventasPorMetodoPago = {
            efectivo: ventas.filter(s => s.paymentMethod === "Efectivo").reduce((sum, s) => sum + Number(s.total), 0),
            transferencia: ventas.filter(s => s.paymentMethod === "Transferencia").reduce((sum, s) => sum + Number(s.total), 0),
            free: ventas.filter(s => s.paymentMethod === "Free").length,
        };

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
            ventasPorMetodoPago,
        };
    }

    async getShiftsReport(dto: GetShiftsDto): Promise<{ shifts: ShiftReportDto[]; total: number }> {
        const { limit = 50, offset = 0, startDate, endDate, userId } = dto;

        const query = this.shiftRepository
            .createQueryBuilder("shift")
            .leftJoinAndSelect("shift.sales", "sale")
            .leftJoinAndSelect("sale.items", "item")
            .leftJoinAndSelect("item.product", "product")
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
            const ventas = shift.sales.filter(s => s.status === "charged");
            const ingresosTotales = ventas.reduce((sum, s) => sum + Number(s.total), 0);
            const gananciaTotal = ventas.reduce((acc, s) => {
                return acc + s.items.reduce((sum, item) => {
                    const ingreso = Number(item.unitPrice) * Number(item.quantity);
                    const costo = Number(item.product?.unitCost || 0) * Number(item.quantity);
                    return sum + (ingreso - costo);
                }, 0);
            }, 0);

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
                    efectivo: ventas.filter(s => s.paymentMethod === "Efectivo").reduce((sum, s) => sum + Number(s.total), 0),
                    transferencia: ventas.filter(s => s.paymentMethod === "Transferencia").reduce((sum, s) => sum + Number(s.total), 0),
                    free: ventas.filter(s => s.paymentMethod === "Free").length,
                },
            };
        });

        return { shifts: shiftReports.slice(offset, offset + limit), total };
    }
}