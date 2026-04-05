import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { SalaryPlan } from "../../salary/entities/salary-plan.entity";

@Entity("providers")
export class Provider {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column({ nullable: true })
    contactName: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    address: string;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;

    // Nuevo: relación con plan de utilidad (profit)
    @ManyToOne(() => SalaryPlan, { nullable: true })
    @JoinColumn({ name: "profit_plan_id" })
    profitPlan: SalaryPlan | null;

    @Column({ name: "profit_plan_id", nullable: true })
    profitPlanId: number | null;
}