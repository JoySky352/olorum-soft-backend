import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Sale } from "./sale.entity";
import { Product } from "src/modules/inventory/entities/product.entity";

@Entity("sale_items")
export class SaleItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "sale_id" })
  saleId: number;

  @ManyToOne(() => Sale, (sale) => sale.items, { onDelete: "CASCADE" })
  @JoinColumn({ name: "sale_id" })
  sale: Sale;

  @Column({ name: "product_id" })
  productId: number;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: "product_id" })
  product: Product;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  total: number;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  refunded: number;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  quantity: number;

  @Column({
    type: "decimal",
    name: "quantity_refunded",
    precision: 12,
    scale: 2,
    default: 0,
  })
  quantityRefunded: number;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    name: "unit_price",
  })
  unitPrice: number;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    name: "unit_cost",
    default: 0,
  })
  unitCost: number;
}
