import { ApiProperty } from "@nestjs/swagger";

export class PaymentMethodSummaryDto {
  @ApiProperty({ description: "Cantidad de ventas en efectivo" })
  efectivo: number;

  @ApiProperty({ description: "Cantidad de ventas por transferencia" })
  transferencia: number;

  @ApiProperty({ description: "Cantidad de ventas gratuitas" })
  free: number;

  @ApiProperty({ description: "Total de ventas" })
  total: number;
}
