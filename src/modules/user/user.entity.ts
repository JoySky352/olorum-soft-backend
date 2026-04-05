import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate, JoinColumn, ManyToOne } from "typeorm";
import { SalaryPlan } from '../salary/entities/salary-plan.entity';
import * as bcrypt from "bcrypt";

export enum UserRole {
    SUPER_ADMIN = "super_admin",
    SELF_ADMIN = "self_admin",
    DEPENDENT = "dependent",
}

// Tipo para usuario sin contraseña y sin métodos
export type UserWithoutPassword = {
    id: number;
    username: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
};

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    username: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column({
        type: "text",
        default: UserRole.DEPENDENT,
    })
    role: UserRole;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;

    @BeforeInsert()
    @BeforeUpdate()
    async hashPassword() {
        if (this.password) {
            const salt = await bcrypt.genSalt();
            this.password = await bcrypt.hash(this.password, salt);
        }
    }

    async comparePassword(attempt: string): Promise<boolean> {
        return await bcrypt.compare(attempt, this.password);
    }

    @ManyToOne(() => SalaryPlan, { nullable: true })
    @JoinColumn({ name: 'salary_plan_id' })
    salaryPlan: SalaryPlan | null;
}
