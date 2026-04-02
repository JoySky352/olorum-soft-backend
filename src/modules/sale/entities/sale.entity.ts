import { Column, Entity, ManyToOne, JoinColumn, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { SaleItem } from "./sale-item.entity";
import { User } from "../../user/user.entity";
import { Shift } from "../../shift/entities/shift.entity";

@Entity("sales")
export class Sale {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  total: number;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  refunded: number;

  @Column({
    name: "created_at",
    type: "datetime",
  })
  createdAt: Date;

  @Column()
  status: "created" | "charged" | "refunded";

  @Column({
    name: "updated_at",
    type: "date",
    nullable: true,
  })
  updatedAt?: Date;

  @OneToMany(() => SaleItem, (item) => item.sale)
  items: SaleItem[];

  @Column({ name: "payment_method" })
  paymentMethod: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ name: "user_id", nullable: true })
  userId: number;

  @ManyToOne(() => Shift, { nullable: true })
  @JoinColumn({ name: "shift_id" })
  shift: Shift;

  @Column({ name: "shift_id", nullable: true })
  shiftId: number;
}