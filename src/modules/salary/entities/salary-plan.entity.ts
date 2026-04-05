import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('salary_plans')
export class SalaryPlan {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column('decimal', { precision: 10, scale: 2 })
    fixedSalary: number;

    @Column('decimal', { precision: 5, scale: 2, nullable: true })
    variablePercentage: number | null;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}