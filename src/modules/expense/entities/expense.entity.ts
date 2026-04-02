import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { ExpenseCategory } from "./expense-category.entity";
import { User } from "../../user/user.entity";
import { Shift } from "../../shift/entities/shift.entity";

@Entity("expenses")
export class Expense {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 255 })
    description: string;

    @Column({ type: "decimal", precision: 12, scale: 2 })
    amount: number;

    @ManyToOne(() => ExpenseCategory)
    @JoinColumn({ name: "category_id" })
    category: ExpenseCategory;

    @Column({ name: "category_id" })
    categoryId: number;

    @Column({ name: "category_name", type: "varchar", length: 100 })
    categoryName: string;

    @Column({ name: "expense_date", type: "datetime" })
    expenseDate: Date;

    @Column({ type: "varchar", length: 255, nullable: true })
    receipt: string;

    @Column({ type: "text", nullable: true })
    notes: string | null;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user: User;

    @Column({ name: "user_id" })
    userId: number;

    @Column({ name: "user_name", type: "varchar", length: 100 })
    userName: string;

    @ManyToOne(() => Shift, { nullable: true })
    @JoinColumn({ name: "shift_id" })
    shift: Shift;

    @Column({ name: "shift_id", nullable: true })
    shiftId: number | null;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;
}