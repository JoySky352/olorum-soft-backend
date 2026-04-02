import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from "typeorm";
import { User } from "../../user/user.entity";
import { Sale } from "../../sale/entities/sale.entity";

@Entity("shifts")
export class Shift {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user: User;

    @Column({ name: "user_id" })
    userId: number;

    @Column({ name: "user_name" })
    userName: string;

    @Column({ name: "opened_at", type: "datetime" })
    openedAt: Date;

    @Column({ name: "closed_at", type: "datetime", nullable: true })
    closedAt: Date | null;

    @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
    openingCash: number;

    @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
    closingCash: number | null;

    @Column({ default: "open" })
    status: "open" | "closed";

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;

    @OneToMany(() => Sale, (sale) => sale.shift)
    sales: Sale[];
}