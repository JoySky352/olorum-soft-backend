import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty } from "class-validator";
import { Type } from "class-transformer";
import { RefundSaleItemDto } from "./refund-sale-item.dto";

export class RefundSaleDto {
  @ApiProperty({ isArray: true, type: RefundSaleItemDto })
  @IsArray({ each: true })
  @IsNotEmpty()
  @Type(() => RefundSaleItemDto)
  items: RefundSaleItemDto[];
}
