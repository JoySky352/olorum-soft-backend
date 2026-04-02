import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "../../user/user.entity";
import { Shift } from "../../shift/entities/shift.entity";

@Entity("cash_withdrawals")
export class CashWithdrawal {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "decimal", precision: 12, scale: 2 })
    amount: number;

    @Column({ type: "text" })
    reason: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user: User;

    @Column({ name: "user_id" })
    userId: number;

    @Column({ name: "user_name" })
    userName: string;

    @ManyToOne(() => Shift)
    @JoinColumn({ name: "shift_id" })
    shift: Shift;

    @Column({ name: "shift_id" })
    shiftId: number;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;
}