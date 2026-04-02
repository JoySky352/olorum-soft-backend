import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { Shift } from "../../shift/entities/shift.entity";
import { Sale } from "../../sale/entities/sale.entity";
import { GetShiftReportDto, ShiftReportResponseDto, ShiftReportSummaryDto } from "../dto/shift-report.dto";

@Injectable()
export class ShiftReportService {
    constructor(
        @InjectRepository(Shift)
        private shiftRepository: Repository<Shift>,
        @InjectRepository(Sale)
        private saleRepository: Repository<Sale>,
    ) { }

    async getShiftReport(dto: GetShiftReportDto): Promise<ShiftReportResponseDto> {
        const { startDate, endDate, userId, status } = dto;

        // Construir query de turnos
        const shiftQuery = this.shiftRepository
            .createQueryBuilder("shift")
            .leftJoinAndSelect("shift.sales", "sale")
            .leftJoinAndSelect("sale.items", "item")
            .leftJoinAndSelect("item.product", "product")
            .orderBy("shift.opened_at", "ASC");

        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            shiftQuery.andWhere("shift.opened_at BETWEEN :start AND :end", { start, end });
        }

        if (userId) {
            shiftQuery.andWhere("shift.user_id = :userId", { userId });
        }

        if (status) {
            shiftQuery.andWhere("shift.status = :status", { status });
        }

        const shifts = await shiftQuery.getMany();

        // Calcular resumen general
        let totalVentas = 0;
        let ingresosTotales = 0;
        let gananciaTotal = 0;
        let totalProductosVendidos = 0;
        const ventasPorMetodoPago = {
            efectivo: 0,
            transferencia: 0,
            free: 0,
            freeCosto: 0,
        };
        const ventasPorProveedor: Map<string, { totalVentas: number; montoTotal: number; gananciaTotal: number }> = new Map();
        const ventasPorUsuario: Map<number, { userName: string; totalVentas: number; ingresosTotales: number; gananciaTotal: number }> = new Map();
        const turnosData: any[] = [];

        for (const shift of shifts) {
            const ventas = shift.sales.filter(s => s.status === "charged");
            const ventasCount = ventas.length;
            const ingresos = ventas.reduce((sum, s) => sum + Number(s.total), 0);

            let gananciaShift = 0;
            let productosCount = 0;

            for (const sale of ventas) {
                // Calcular ganancia por venta
                for (const item of sale.items) {
                    const ingreso = Number(item.unitPrice) * Number(item.quantity);
                    const costo = Number(item.product?.unitCost || 0) * Number(item.quantity);
                    gananciaShift += ingreso - costo;
                    productosCount += Number(item.quantity);

                    // Ventas por método de pago
                    if (sale.paymentMethod === "Efectivo") {
                        ventasPorMetodoPago.efectivo += ingreso;
                    } else if (sale.paymentMethod === "Transferencia") {
                        ventasPorMetodoPago.transferencia += ingreso;
                    } else if (sale.paymentMethod === "Free") {
                        ventasPorMetodoPago.freeCosto += costo;
                        ventasPorMetodoPago.free += 1;
                    }

                    // Ventas por proveedor
                    const provider = item.product?.investor;
                    if (provider) {
                        const existing = ventasPorProveedor.get(provider) || { totalVentas: 0, montoTotal: 0, gananciaTotal: 0 };
                        existing.totalVentas += 1;
                        existing.montoTotal += ingreso;
                        existing.gananciaTotal += ingreso - costo;
                        ventasPorProveedor.set(provider, existing);
                    }
                }
            }

            // Ventas por usuario
            const userExisting = ventasPorUsuario.get(shift.userId) || {
                userName: shift.userName,
                totalVentas: 0,
                ingresosTotales: 0,
                gananciaTotal: 0,
            };
            userExisting.totalVentas += ventasCount;
            userExisting.ingresosTotales += ingresos;
            userExisting.gananciaTotal += gananciaShift;
            ventasPorUsuario.set(shift.userId, userExisting);

            totalVentas += ventasCount;
            ingresosTotales += ingresos;
            gananciaTotal += gananciaShift;
            totalProductosVendidos += productosCount;

            turnosData.push({
                id: shift.id,
                userName: shift.userName,
                openedAt: shift.openedAt.toISOString(),
                closedAt: shift.closedAt?.toISOString() || null,
                totalVentas: ventasCount,
                ingresosTotales: ingresos,
                gananciaTotal: gananciaShift,
            });
        }

        const promedioPorVenta = totalVentas > 0 ? ingresosTotales / totalVentas : 0;

        return {
            periodo: {
                startDate: startDate ? new Date(startDate).toISOString() : "inicio",
                endDate: endDate ? new Date(endDate).toISOString() : "fin",
                turnosIncluidos: shifts.length,
            },
            resumen: {
                totalVentas,
                ingresosTotales: parseFloat(ingresosTotales.toFixed(2)),
                gananciaTotal: parseFloat(gananciaTotal.toFixed(2)),
                totalProductosVendidos,
                promedioPorVenta: parseFloat(promedioPorVenta.toFixed(2)),
                ventasPorMetodoPago: {
                    efectivo: parseFloat(ventasPorMetodoPago.efectivo.toFixed(2)),
                    transferencia: parseFloat(ventasPorMetodoPago.transferencia.toFixed(2)),
                    free: ventasPorMetodoPago.free,
                    freeCosto: parseFloat(ventasPorMetodoPago.freeCosto.toFixed(2)),
                },
                ventasPorProveedor: Array.from(ventasPorProveedor.entries()).map(([proveedor, data]) => ({
                    proveedor,
                    totalVentas: data.totalVentas,
                    montoTotal: parseFloat(data.montoTotal.toFixed(2)),
                    gananciaTotal: parseFloat(data.gananciaTotal.toFixed(2)),
                })),
                ventasPorUsuario: Array.from(ventasPorUsuario.entries()).map(([userId, data]) => ({
                    userId,
                    userName: data.userName,
                    totalVentas: data.totalVentas,
                    ingresosTotales: parseFloat(data.ingresosTotales.toFixed(2)),
                    gananciaTotal: parseFloat(data.gananciaTotal.toFixed(2)),
                })),
            },
            turnos: turnosData,
        };
    }

    async exportShiftReportToExcel(dto: GetShiftReportDto): Promise<Buffer> {
        const report = await this.getShiftReport(dto);
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();

        // Hoja de resumen
        const summarySheet = workbook.addWorksheet('Resumen General');

        // Título
        summarySheet.mergeCells('A1:D1');
        summarySheet.getCell('A1').value = 'REPORTE DE TURNOS';
        summarySheet.getCell('A1').font = { size: 16, bold: true };
        summarySheet.getCell('A1').alignment = { horizontal: 'center' };

        // Periodo
        summarySheet.getCell('A3').value = 'Período:';
        summarySheet.getCell('B3').value = `${new Date(report.periodo.startDate).toLocaleDateString('es-CU')} al ${new Date(report.periodo.endDate).toLocaleDateString('es-CU')}`;
        summarySheet.getCell('A4').value = 'Turnos incluidos:';
        summarySheet.getCell('B4').value = report.periodo.turnosIncluidos;

        // Resumen general
        summarySheet.getCell('A6').value = 'RESUMEN GENERAL';
        summarySheet.getCell('A6').font = { bold: true };

        const summaryData = [
            ['Total de Ventas', report.resumen.totalVentas],
            ['Ingresos Totales', `$${report.resumen.ingresosTotales.toFixed(2)}`],
            ['Ganancia Total', `$${report.resumen.gananciaTotal.toFixed(2)}`],
            ['Total Productos Vendidos', report.resumen.totalProductosVendidos],
            ['Promedio por Venta', `$${report.resumen.promedioPorVenta.toFixed(2)}`],
        ];

        let row = 7;
        for (const [label, value] of summaryData) {
            summarySheet.getCell(`A${row}`).value = label;
            summarySheet.getCell(`A${row}`).font = { bold: true };
            summarySheet.getCell(`B${row}`).value = value;
            row++;
        }

        // Ventas por método de pago
        row += 2;
        summarySheet.getCell(`A${row}`).value = 'VENTAS POR MÉTODO DE PAGO';
        summarySheet.getCell(`A${row}`).font = { bold: true };
        row++;

        summarySheet.getCell(`A${row}`).value = 'Método';
        summarySheet.getCell(`B${row}`).value = 'Monto';
        summarySheet.getCell(`A${row}`).font = { bold: true };
        summarySheet.getCell(`B${row}`).font = { bold: true };
        row++;

        const paymentMethods = [
            ['Efectivo', `$${report.resumen.ventasPorMetodoPago.efectivo.toFixed(2)}`],
            ['Transferencia', `$${report.resumen.ventasPorMetodoPago.transferencia.toFixed(2)}`],
            ['Free (Cuenta Casa)', report.resumen.ventasPorMetodoPago.free],
            ['Costo de Free', `$${report.resumen.ventasPorMetodoPago.freeCosto.toFixed(2)}`],
        ];

        for (const [method, amount] of paymentMethods) {
            summarySheet.getCell(`A${row}`).value = method;
            summarySheet.getCell(`B${row}`).value = amount;
            row++;
        }

        // Ventas por proveedor
        if (report.resumen.ventasPorProveedor.length > 0) {
            row += 2;
            summarySheet.getCell(`A${row}`).value = 'VENTAS POR PROVEEDOR';
            summarySheet.getCell(`A${row}`).font = { bold: true };
            row++;

            summarySheet.getCell(`A${row}`).value = 'Proveedor';
            summarySheet.getCell(`B${row}`).value = 'Ventas';
            summarySheet.getCell(`C${row}`).value = 'Monto';
            summarySheet.getCell(`D${row}`).value = 'Ganancia';
            summarySheet.getCell(`A${row}`).font = { bold: true };
            summarySheet.getCell(`B${row}`).font = { bold: true };
            summarySheet.getCell(`C${row}`).font = { bold: true };
            summarySheet.getCell(`D${row}`).font = { bold: true };
            row++;

            for (const prov of report.resumen.ventasPorProveedor) {
                summarySheet.getCell(`A${row}`).value = prov.proveedor;
                summarySheet.getCell(`B${row}`).value = prov.totalVentas;
                summarySheet.getCell(`C${row}`).value = `$${prov.montoTotal.toFixed(2)}`;
                summarySheet.getCell(`D${row}`).value = `$${prov.gananciaTotal.toFixed(2)}`;
                row++;
            }
        }

        // Ventas por usuario
        if (report.resumen.ventasPorUsuario.length > 0) {
            row += 2;
            summarySheet.getCell(`A${row}`).value = 'VENTAS POR USUARIO';
            summarySheet.getCell(`A${row}`).font = { bold: true };
            row++;

            summarySheet.getCell(`A${row}`).value = 'Usuario';
            summarySheet.getCell(`B${row}`).value = 'Ventas';
            summarySheet.getCell(`C${row}`).value = 'Ingresos';
            summarySheet.getCell(`D${row}`).value = 'Ganancia';
            summarySheet.getCell(`A${row}`).font = { bold: true };
            summarySheet.getCell(`B${row}`).font = { bold: true };
            summarySheet.getCell(`C${row}`).font = { bold: true };
            summarySheet.getCell(`D${row}`).font = { bold: true };
            row++;

            for (const user of report.resumen.ventasPorUsuario) {
                summarySheet.getCell(`A${row}`).value = user.userName;
                summarySheet.getCell(`B${row}`).value = user.totalVentas;
                summarySheet.getCell(`C${row}`).value = `$${user.ingresosTotales.toFixed(2)}`;
                summarySheet.getCell(`D${row}`).value = `$${user.gananciaTotal.toFixed(2)}`;
                row++;
            }
        }

        // Hoja de turnos detallados
        const shiftsSheet = workbook.addWorksheet('Turnos Detallados');
        shiftsSheet.getCell('A1').value = 'LISTADO DE TURNOS';
        shiftsSheet.getCell('A1').font = { bold: true, size: 14 };

        shiftsSheet.getCell('A3').value = 'ID';
        shiftsSheet.getCell('B3').value = 'Usuario';
        shiftsSheet.getCell('C3').value = 'Apertura';
        shiftsSheet.getCell('D3').value = 'Cierre';
        shiftsSheet.getCell('E3').value = 'Ventas';
        shiftsSheet.getCell('F3').value = 'Ingresos';
        shiftsSheet.getCell('G3').value = 'Ganancia';

        for (let i = 0; i < 7; i++) {
            shiftsSheet.getCell(String.fromCharCode(65 + i) + '3').font = { bold: true };
        }

        let shiftRow = 4;
        for (const turno of report.turnos) {
            shiftsSheet.getCell(`A${shiftRow}`).value = turno.id;
            shiftsSheet.getCell(`B${shiftRow}`).value = turno.userName;
            shiftsSheet.getCell(`C${shiftRow}`).value = new Date(turno.openedAt).toLocaleString('es-CU');
            shiftsSheet.getCell(`D${shiftRow}`).value = turno.closedAt ? new Date(turno.closedAt).toLocaleString('es-CU') : 'Abierto';
            shiftsSheet.getCell(`E${shiftRow}`).value = turno.totalVentas;
            shiftsSheet.getCell(`F${shiftRow}`).value = `$${turno.ingresosTotales.toFixed(2)}`;
            shiftsSheet.getCell(`G${shiftRow}`).value = `$${turno.gananciaTotal.toFixed(2)}`;
            shiftRow++;
        }

        // Ajustar columnas
        summarySheet.columns.forEach(col => {
            let maxLength = 12;
            col.eachCell?.({ includeEmpty: true }, (cell) => {
                const val = cell.value ? String(cell.value) : "";
                if (val.length > maxLength) maxLength = val.length;
            });
            col.width = maxLength + 2;
        });

        shiftsSheet.columns.forEach(col => {
            let maxLength = 12;
            col.eachCell?.({ includeEmpty: true }, (cell) => {
                const val = cell.value ? String(cell.value) : "";
                if (val.length > maxLength) maxLength = val.length;
            });
            col.width = maxLength + 2;
        });

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
}