/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from "@nestjs/common";
import * as ExcelJS from "exceljs";
import { SaleService } from "src/modules/sale/services/sale.service";

@Injectable()
export class DailyReportService {
  constructor(private readonly saleService: SaleService) {}

  async getReport(date: Date): Promise<Buffer> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const { data } = await this.saleService.findAll({
      startDate,
      endDate,
      limit: 100000,
    });

    const sales = data;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Reporte Diario");

    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    const alignRight = { horizontal: "right" as const };
    const alignLeft = { horizontal: "left" as const };
    const alignCenter = { horizontal: "center" as const };

    const proveedorMap = new Map();

    for (const sale of sales) {
      for (const item of sale.items) {
        const producto = item.product;
        const investor = producto.investor || process.env.NEGOCIO;
        const id = producto.id;

        if (!proveedorMap.has(investor)) {
          proveedorMap.set(investor, {
            productos: new Map(),
            totalVentaProveedor: 0,
            gananciaTotal: 0,
            total40MasCosto: 0,
            total60: 0,
            gananciaTotalOlorun: 0,
            totalOlorun: 0,
          });
        }

        const proveedorData = proveedorMap.get(investor)!;

        if (!proveedorData.productos.has(id)) {
          proveedorData.productos.set(id, {
            nombre: producto.name,
            cantidad: 0,
            totalVenta: 0,
            stock: producto.stock,
            precioVenta: producto.unitPrice,
            precioCosto: producto.unitCost,
          });
        }

        const prodData = proveedorData.productos.get(id)!;
        prodData.cantidad += item.quantity;
        prodData.totalVenta += item.unitPrice * item.quantity;

        const gananciaPorUnidad = producto.unitPrice - producto.unitCost;
        const gananciaTotalProd = gananciaPorUnidad * item.quantity;
        const totalProducto = item.unitPrice * item.quantity;

        proveedorData.totalVentaProveedor += totalProducto;
        proveedorData.gananciaTotal += gananciaTotalProd;

        if (!producto.investor) {
          proveedorData.totalOlorun +=
            sale.paymentMethod === "Free"
              ? -producto.unitCost * item.quantity
              : 0;
          proveedorData.gananciaTotalOlorun +=
            sale.paymentMethod === "Free"
              ? -producto.unitCost * item.quantity
              : 0;
        } else {
          proveedorData.totalOlorun += totalProducto;
          proveedorData.gananciaTotalOlorun += gananciaTotalProd;
        }

        proveedorData.total40MasCosto +=
          gananciaPorUnidad * item.quantity * 0.4 +
          producto.unitCost * item.quantity;

        proveedorData.total60 += gananciaPorUnidad * item.quantity * 0.6;
      }
    }

    let currentRow = 1;
    const fechaStr = date.toISOString();
    const titulo = `REPORTE DE VENTAS - ${fechaStr.toUpperCase()}`;
    worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = titulo;
    titleCell.font = { size: 10, bold: true };
    titleCell.alignment = alignCenter;
    currentRow += 2;

    let totalGlobal = 0;
    let gananciaGlobal = 0;

    for (const [proveedor, data] of proveedorMap.entries()) {
      const isOlorun = proveedor.toLowerCase() === process.env.NEGOCIO;

      worksheet.getCell(`A${currentRow}`).value = proveedor;
      worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 10 };
      worksheet.getCell(`A${currentRow}`).alignment = alignLeft;
      currentRow += 1;

      const headers = ["Producto", "Stock", "Cantidad", "Total Venta"];
      if (!isOlorun) headers.push("40% + Costo", "60% Ganancia");

      worksheet.addRow(headers);
      const headerRow = worksheet.getRow(currentRow);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD9D9D9" },
      };
      headerRow.eachCell((cell) => {
        cell.border = borderStyle;
        cell.alignment = alignCenter;
      });
      currentRow++;

      for (const producto of data.productos.values()) {
        const row = [
          producto.nombre,
          producto.stock,
          producto.cantidad,
          producto.totalVenta,
        ];

        if (!isOlorun) {
          const gananciaUnidad = producto.precioVenta - producto.precioCosto;
          const total40MasCosto =
            gananciaUnidad * producto.cantidad * 0.4 +
            producto.precioCosto * producto.cantidad;
          const total60 = gananciaUnidad * producto.cantidad * 0.6;
          row.push(total40MasCosto, total60);
        }

        worksheet.addRow(row);
        worksheet.getRow(currentRow).eachCell((cell, col) => {
          cell.border = borderStyle;
          cell.alignment = col > 1 ? alignRight : alignLeft;
        });
        currentRow++;
      }

      worksheet.addRow([]);
      currentRow++;

      const addResumen = (
        label: string,
        value: number,
        fontOptions = { bold: true },
      ) => {
        worksheet.getCell(`A${currentRow}`).value = label;
        worksheet.getCell(`A${currentRow}`).font = fontOptions;
        worksheet.getCell(`A${currentRow}`).alignment = alignLeft;
        worksheet.getCell(`B${currentRow}`).value = value;
        worksheet.getCell(`B${currentRow}`).alignment = alignRight;
        worksheet.getCell(`A${currentRow}`).border = borderStyle;
        worksheet.getCell(`B${currentRow}`).border = borderStyle;
        currentRow++;
      };

      if (!isOlorun) addResumen("TOTAL DEL DÍA", data.totalVentaProveedor);
      else addResumen("TOTAL DEL DÍA", data.totalOlorun);
      totalGlobal += data.totalOlorun;

      if (!isOlorun) addResumen("GANANCIA TOTAL", data.gananciaTotal);
      else addResumen("GANANCIA TOTAL", data.gananciaTotalOlorun);
      gananciaGlobal += data.gananciaTotalOlorun;

      if (!isOlorun) {
        addResumen("40% + COSTO", data.total40MasCosto);
        addResumen("60% GANANCIA", data.total60);
      }

      worksheet.addRow([]);
      currentRow++;
    }

    worksheet.getCell(`A${currentRow}`).value = "RESUMEN GENERAL";
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 10 };
    worksheet.getCell(`A${currentRow}`).alignment = alignLeft;
    currentRow++;

    const addResumenFinal = (label: string, value: number) => {
      worksheet.getCell(`A${currentRow}`).value = label;
      worksheet.getCell(`A${currentRow}`).font = { bold: true };
      worksheet.getCell(`A${currentRow}`).alignment = alignLeft;
      worksheet.getCell(`B${currentRow}`).value = value;
      worksheet.getCell(`B${currentRow}`).alignment = alignRight;
      worksheet.getCell(`A${currentRow}`).border = borderStyle;
      worksheet.getCell(`B${currentRow}`).border = borderStyle;
      currentRow++;
    };

    addResumenFinal("TOTAL GLOBAL DEL DÍA", totalGlobal);
    addResumenFinal("GANANCIA GLOBAL TOTAL", gananciaGlobal);

    worksheet.columns.forEach((col) => {
      let maxLength = 10;
      col.eachCell?.({ includeEmpty: true }, (cell) => {
        const val = cell.value ? `${cell.value}` : "";
        if (val.length > maxLength) maxLength = val.length;
      });
      col.width = maxLength + 4;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
