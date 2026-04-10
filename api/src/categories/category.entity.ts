import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Owner — null means a shared/default category seeded for everyone */
  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 10 })
  type: 'income' | 'expense' | 'both';

  @Column({ type: 'varchar', length: 10, default: '📦' })
  icon: string;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
