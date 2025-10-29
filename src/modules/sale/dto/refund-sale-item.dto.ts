import { ApiProperty } from "@nestjs/swagger";
import { IsDecimal, IsNumber } from "class-validator";

export class RefundSaleItemDto {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsNumber()
  productId: number;

  @ApiProperty()
  @IsDecimal({ decimal_digits: "2" })
  quantityToRefund: number;
}
