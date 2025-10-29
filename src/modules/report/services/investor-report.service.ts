import * as ExcelJS from "exceljs";
import { Injectable } from "@nestjs/common";
import { SaleService } from "src/modules/sale/services/sale.service";

@Injectable()
export class InvestorReportService {
  constructor(private readonly saleService: SaleService) {}

  async getReport(
    investor: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Buffer> {
    const { data } = await this.saleService.findAll({
      startDate,
      endDate,
      limit: 100000,
    }); //Arreglo con las ventas
    const sales = data;

    let montoTotal = 0;
    let costoTotal = 0;
    let gananciaTotal = 0;
    let total40MasCosto = 0;
    let total60Ganancia = 0;
    let totalSales = 0;

    for (const sale of sales) {
      const items = sale.items.filter((item) => {
        return (
          item.product?.investor?.toLowerCase?.() === investor.toLowerCase()
        );
      });

      if (items.length === 0) continue;
      totalSales += 1;

      let subtotalVenta = 0;
      let subtotalCosto = 0;
      let subtotalGanancia = 0;

      for (const item of items) {
        const precioVenta = item.unitPrice;
        const precioCosto = item.product.unitCost;
        const quantity = item.quantity;

        subtotalVenta += precioVenta * quantity;
        subtotalCosto += precioCosto * quantity;
        subtotalGanancia += (precioVenta - precioCosto) * quantity;
      }

      montoTotal += subtotalVenta;
      costoTotal += subtotalCosto;
      gananciaTotal += subtotalGanancia;
      total40MasCosto += subtotalGanancia * 0.4 + subtotalCosto;
      total60Ganancia += subtotalGanancia * 0.6;
    }

    // -------------------- Generar Excel con resumen ---------------------
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Resumen Proveedor");

    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    const alignRight = { horizontal: "right" as const };
    const alignLeft = { horizontal: "left" as const };

    let currentRow = 1;

    const fechaInicioStr = startDate.toISOString();
    const fechaFinStr = endDate.toISOString();

    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value =
      `Rango de fecha: ${fechaInicioStr} al ${fechaFinStr}`;
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    worksheet.getCell(`A${currentRow}`).alignment = alignLeft;
    currentRow += 2;

    worksheet.getCell(`A${currentRow}`).value = "Proveedor:";
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    worksheet.getCell(`B${currentRow}`).value = investor;
    currentRow++;

    const resumenes = [
      ["Total de ventas:", totalSales],
      ["Monto total:", montoTotal],
      ["Costo total:", costoTotal],
      ["Ganancia total:", gananciaTotal],
      ["40% + Costo:", total40MasCosto],
      ["60% Ganancia:", total60Ganancia],
    ];

    for (const [label, value] of resumenes) {
      worksheet.getCell(`A${currentRow}`).value = label;
      worksheet.getCell(`A${currentRow}`).font = { bold: true };
      worksheet.getCell(`A${currentRow}`).alignment = alignLeft;
      worksheet.getCell(`A${currentRow}`).border = borderStyle;

      worksheet.getCell(`B${currentRow}`).value = value;
      worksheet.getCell(`B${currentRow}`).alignment = alignRight;
      worksheet.getCell(`B${currentRow}`).border = borderStyle;

      currentRow++;
    }

    worksheet.columns.forEach((col) => {
      let maxLength = 12;
      col.eachCell?.({ includeEmpty: true }, (cell) => {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        const val = cell.value ? String(cell.value) : "";
        if (val.length > maxLength) maxLength = val.length;
      });
      col.width = maxLength + 2;
    });

    const buffer = await workbook.xlsx.writeBuffer();

    // -------------------------------------------------------------------

    return Buffer.from(buffer);
  }
}
