import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: 'free' })
  plan: string;

  @Column({ nullable: true })
  company: string;

  @Column({ nullable: true })
  fullName: string;

  @Column({ default: 'admin' })
  role: string;

  /** Telegram user ID, set when user runs /link <token> in bot */
  @Column({ nullable: true, unique: true })
  telegramId: string;

  @CreateDateColumn()
  createdAt: Date;
}
