import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Provider } from '../../setting/entities/provider.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({ length: 100, nullable: true })
  description: string;

  @Column({ nullable: true })
  picture?: string;

  @Column({ name: 'unit_cost', type: 'decimal', precision: 12, scale: 2 })
  unitCost: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  stock: number;

  @Column({ name: 'created_at', type: 'date', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ nullable: true })
  category?: string;

  // Relación con proveedor
  @ManyToOne(() => Provider, { nullable: true })
  @JoinColumn({ name: 'investor_id' })
  investorEntity?: Provider;

  @Column({ name: 'investor_id', nullable: true })
  investorId?: number;

  // Para compatibilidad con el código existente (investor string)
  @Column({ nullable: true })
  investor?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'date', nullable: true })
  expiryDate?: Date;
}