import { ApiProperty } from '@nestjs/swagger';

export class UserProfitDto {
    @ApiProperty()
    userId: number;
    @ApiProperty()
    userName: string;
    @ApiProperty()
    role: string;
    @ApiProperty()
    planName: string | null;
    @ApiProperty()
    planType: 'salary' | 'profit' | null;
    @ApiProperty()
    amount: number;
}

export class ProviderProfitDto {
    @ApiProperty()
    providerId: number;
    @ApiProperty()
    providerName: string;
    @ApiProperty()
    planName: string | null;
    @ApiProperty()
    profitGenerated: number;
    @ApiProperty()
    amount: number;
}

export class ProfitReportDto {
    @ApiProperty()
    period: { startDate: string; endDate: string };
    @ApiProperty()
    totalGrossProfit: number;
    @ApiProperty()
    totalExpenses: number;
    @ApiProperty()
    netProfit: number;
    @ApiProperty({ type: [UserProfitDto] })
    users: UserProfitDto[];
    @ApiProperty({ type: [ProviderProfitDto] })
    providers: ProviderProfitDto[];
}