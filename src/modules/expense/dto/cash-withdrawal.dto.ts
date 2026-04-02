import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsString, IsOptional, Min, IsDate } from "class-validator";
import { Type } from "class-transformer";

export class CreateCashWithdrawalDto {
    @ApiProperty({ example: 100.00 })
    @IsNumber()
    @Min(0.01)
    amount: number;

    @ApiProperty({ example: "Compra de suministros" })
    @IsString()
    reason: string;
}

export class GetCashWithdrawalsDto {
    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    startDate?: Date;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    endDate?: Date;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    shiftId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    limit?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    offset?: number;
}