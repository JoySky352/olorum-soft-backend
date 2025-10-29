import { ApiProperty } from "@nestjs/swagger";

export class TotalSalesDto {
  @ApiProperty({ example: 10 })
  totalVentas: number;

  @ApiProperty({ example: 1500.75 })
  ingresosTotales: number;

  @ApiProperty({ example: 300.25 })
  gananciaTotal: number;
}
