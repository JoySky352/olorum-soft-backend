import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDate, IsOptional } from "class-validator";

export class GetTotalSalesDto {
  @ApiPropertyOptional({ description: "Fecha inicio" })
  @IsOptional()
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ description: "Fecha fin" })
  @IsOptional()
  @IsDate()
  endDate?: Date;
}
