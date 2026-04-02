import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { CashWithdrawal } from "../entities/cash-withdrawal.entity";
import { ShiftService } from "../../shift/services/shift.service";
import { CreateCashWithdrawalDto, GetCashWithdrawalsDto } from "../dto/cash-withdrawal.dto";
import { PaginatedResponseDto } from "src/core/dto/paginated-response.dto";

@Injectable()
export class CashWithdrawalService {
    constructor(
        @InjectRepository(CashWithdrawal)
        private withdrawalRepository: Repository<CashWithdrawal>,
        private shiftService: ShiftService,
    ) { }

    async create(dto: CreateCashWithdrawalDto, userId: number, userName: string): Promise<CashWithdrawal> {
        // Verificar que el usuario tiene un turno abierto
        const currentShift = await this.shiftService.getCurrentShift(userId);
        if (!currentShift) {
            throw new BadRequestException("No hay un turno abierto. No se puede realizar la extracción.");
        }

        const withdrawal = this.withdrawalRepository.create({
            amount: dto.amount,
            reason: dto.reason,
            userId,
            userName,
            shiftId: currentShift.id,
        });

        return this.withdrawalRepository.save(withdrawal);
    }

    async findAll(dto: GetCashWithdrawalsDto): Promise<PaginatedResponseDto<CashWithdrawal>> {
        const { limit = 10, offset = 0, startDate, endDate, shiftId } = dto;

        const query = this.withdrawalRepository
            .createQueryBuilder("withdrawal")
            .orderBy("withdrawal.created_at", "DESC")
            .skip(offset)
            .take(limit);

        if (shiftId) {
            query.andWhere("withdrawal.shift_id = :shiftId", { shiftId });
        }

        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.andWhere("withdrawal.created_at BETWEEN :start AND :end", { start, end });
        }

        const [data, total] = await query.getManyAndCount();
        return new PaginatedResponseDto(data, total, limit, offset);
    }

    async getTotalByShift(shiftId: number): Promise<number> {
        const result = await this.withdrawalRepository
            .createQueryBuilder("withdrawal")
            .select("SUM(withdrawal.amount)", "total")
            .where("withdrawal.shift_id = :shiftId", { shiftId })
            .getRawOne();

        return Number(result?.total || 0);
    }
}