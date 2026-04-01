import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from "typeorm";
import { Product } from "./product.entity";
import { User } from "../../user/user.entity";

@Entity("stock_movements")
export class StockMovement {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: "product_id" })
    productId: number;

    @ManyToOne(() => Product)
    @JoinColumn({ name: "product_id" })
    product: Product;

    @Column({ name: "product_name" })
    productName: string;

    @Column({ name: "previous_stock", type: "decimal", precision: 12, scale: 2 })
    previousStock: number;

    @Column({ name: "previous_unit_cost", type: "decimal", precision: 12, scale: 2 })
    previousUnitCost: number;

    @Column({ name: "previous_unit_price", type: "decimal", precision: 12, scale: 2 })
    previousUnitPrice: number;

    @Column({ name: "new_stock", type: "decimal", precision: 12, scale: 2 })
    newStock: number;

    @Column({ name: "new_unit_cost", type: "decimal", precision: 12, scale: 2 })
    newUnitCost: number;

    @Column({ name: "new_unit_price", type: "decimal", precision: 12, scale: 2 })
    newUnitPrice: number;

    @Column({ name: "quantity_added", type: "decimal", precision: 12, scale: 2 })
    quantityAdded: number;

    @Column({ type: "varchar", length: 50 })
    type: string;

    @Column({ type: "text", nullable: true })
    reason: string | null;

    @Column({ name: "user_id" })
    userId: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user: User;

    @Column({ name: "user_name" })
    userName: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;
}