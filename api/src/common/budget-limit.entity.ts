import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Category } from '../categories/category.entity';

@Entity('budget_limits')
export class BudgetLimit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Owner */
  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @ManyToOne(() => Category, { eager: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'category_id' })
  categoryId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  limitAmount: number;

  @Column({ type: 'varchar', length: 10, default: 'month' })
  period: string;
}
