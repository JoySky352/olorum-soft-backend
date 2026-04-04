// src/modules/setting/entities/exchange-rate.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('exchange_rates')
export class ExchangeRate {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    key: string; // 'USD' o 'EUR'

    @Column('decimal', { precision: 10, scale: 2 })
    value: number;

    @UpdateDateColumn()
    updatedAt: Date;
}