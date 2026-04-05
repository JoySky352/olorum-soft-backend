import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type PlanType = 'salary' | 'profit';

@Entity('salary_plans')
export class SalaryPlan {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    fixedSalary: number | null;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    variablePercentage: number | null;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    thresholdAmount: number | null;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    extraPercentage: number | null;

    @Column({ type: 'varchar', default: 'salary' })
    planType: PlanType;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}