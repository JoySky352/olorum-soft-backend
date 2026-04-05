import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsObject, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { MixedPaymentDto, USDPaymentDto } from "./create-sale.dto";

export class CompletePendingSaleDto {
    @ApiProperty({ example: "Efectivo", enum: ["Efectivo", "Transferencia", "Mixto", "USD", "EUR"] })
    @IsString()
    paymentMethod: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => MixedPaymentDto)
    mixedPayment?: MixedPaymentDto;

    @ApiPropertyOptional()
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => USDPaymentDto)
    usdPayment?: USDPaymentDto;
}