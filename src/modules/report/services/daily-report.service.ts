import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { SaleService } from 'src/modules/sale/services/sale.service';

@Injectable()
export class DailyReportService {
  constructor(private readonly saleService: SaleService) {}

  async getReport(date: Date): Promise<Buffer> {
    const { data } = await this.saleService.findAll({
      startDate: date,
      endDate: new Date(date.toISOString().slice(0, 10) + 'T23:59:59.999Z'),
      limit: 100000,
    }); //Arreglo con las ventas
    const sales = data;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte Diario');

    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: 'thin' as const },
      left: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      right: { style: 'thin' as const },
    };

    const alignRight = { horizontal: 'right' as const };
    const alignLeft = { horizontal: 'left' as const };
    const alignCenter = { horizontal: 'center' as const };

    const proveedorMap = new Map<
      string,
      {
        productos: Map<
          number,
          {
            nombre: string;
            cantidad: number;
            totalVenta: number;
            precioVenta: number;
            stock: number;
            precioCosto: number;
          }
        >;
        totalVentaProveedor: number;
        totalOlorun: number;
        gananciaTotal: number;
        gananciaTotalOlorun: number;
        total40MasCosto: number;
        total60: number;
      }
    >();

    for (const sale of sales) {
      for (const item of sale.items) {
        const producto = item.product;
        const investor = producto.investor || 'olorun';
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
        const gananciaIfFree = !producto.investor
          ? -producto.unitCost
          : -producto.unitPrice;
        const gananciaPorUnidad = producto.unitPrice - producto.unitCost;
        const gananciaTotalProd = gananciaPorUnidad * item.quantity;

        proveedorData.totalVentaProveedor += item.unitPrice * item.quantity;
        proveedorData.totalOlorun +=
          sale.paymentMethod === 'Free'
            ? gananciaIfFree * item.quantity
            : item.unitPrice * item.quantity;
        proveedorData.gananciaTotalOlorun +=
          sale.paymentMethod === 'Free'
            ? gananciaIfFree * item.quantity
            : gananciaTotalProd;
        proveedorData.gananciaTotal += gananciaTotalProd;

        proveedorData.total40MasCosto +=
          gananciaPorUnidad * item.quantity * 0.4 +
          producto.unitPrice * item.quantity;

        proveedorData.total60 += gananciaPorUnidad * item.quantity * 0.6;
        if (item.product.investor) {
          proveedorData.totalOlorun += proveedorData.total60;
          proveedorData.gananciaTotalOlorun += proveedorData.total60;
        }
      }
    }

    let currentRow = 1;

    // TODO: hacer bien esto
    // const fechaStr = formatDate(fecha, "d 'de' MMMM 'de' yyyy", { locale: es });
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
      const isOlorun = proveedor.toLowerCase() === 'olorun';

      worksheet.getCell(`A${currentRow}`).value = proveedor;
      worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 10 };
      worksheet.getCell(`A${currentRow}`).alignment = alignLeft;
      currentRow += 1;

      const headers = ['Producto', 'Stock', 'Cantidad', 'Total Venta'];
      if (!isOlorun) headers.push('40% + Costo', '60% Ganancia');

      worksheet.addRow(headers);
      const headerRow = worksheet.getRow(currentRow);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' },
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

      if (!isOlorun) addResumen('TOTAL DEL DÍA', data.totalVentaProveedor);
      else addResumen('TOTAL DEL DÍA', data.totalOlorun);
      totalGlobal += data.totalOlorun;

      if (!isOlorun) addResumen('GANANCIA TOTAL', data.gananciaTotal);
      else addResumen('GANANCIA TOTAL', data.gananciaTotalOlorun);
      gananciaGlobal += data.gananciaTotalOlorun;

      if (!isOlorun) {
        addResumen('40% + COSTO', data.total40MasCosto);
        addResumen('60% GANANCIA', data.total60);
      }

      worksheet.addRow([]);
      currentRow++;
    }

    // Resumen global al final del reporte
    worksheet.getCell(`A${currentRow}`).value = 'RESUMEN GENERAL';
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

    addResumenFinal('TOTAL GLOBAL DEL DÍA', totalGlobal);
    addResumenFinal('GANANCIA GLOBAL TOTAL', gananciaGlobal);

    worksheet.columns.forEach((col) => {
      let maxLength = 10;
      col.eachCell?.({ includeEmpty: true }, (cell) => {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string, @typescript-eslint/restrict-template-expressions
        const val = cell.value ? `${cell.value}` : '';
        if (val.length > maxLength) maxLength = val.length;
      });
      col.width = maxLength + 4;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
