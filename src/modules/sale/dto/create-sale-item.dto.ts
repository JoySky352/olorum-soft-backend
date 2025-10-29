import { ApiProperty } from "@nestjs/swagger";
import { IsDecimal, IsNumber } from "class-validator";

export class CreateSaleItemDto {
  @ApiProperty()
  @IsNumber()
  productId: number;

  @ApiProperty()
  @IsDecimal({ decimal_digits: "2" })
  unitPrice: number;

  @ApiProperty()
  @IsDecimal({ decimal_digits: "2" })
  quantity: number;
}
