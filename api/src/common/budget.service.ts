import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { BudgetLimit } from './budget-limit.entity';
import { Transaction } from '../transactions/transaction.entity';

@Injectable()
export class BudgetService {
  constructor(
    @InjectRepository(BudgetLimit)
    private budgetRepo: Repository<BudgetLimit>,
    @InjectRepository(Transaction)
    private txRepo: Repository<Transaction>,
  ) {}

  findAll(userId: string) {
    return this.budgetRepo.find({ where: { userId }, relations: ['category'] });
  }

  async create(userId: string, dto: { categoryId: string; limitAmount: number; period?: string }) {
    const existing = await this.budgetRepo.findOne({ where: { userId, categoryId: dto.categoryId } });
    if (existing) {
      await this.budgetRepo.update(existing.id, { limitAmount: dto.limitAmount });
      return this.budgetRepo.findOne({ where: { id: existing.id }, relations: ['category'] });
    }
    const b = this.budgetRepo.create({ ...dto, userId, period: dto.period || 'month' } as any);
    return this.budgetRepo.save(b);
  }

  async remove(userId: string, id: string) {
    return this.budgetRepo.delete({ id, userId });
  }

  async getStatus(userId: string) {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const limits = await this.budgetRepo.find({ where: { userId }, relations: ['category'] });
    const results = [];

    for (const limit of limits) {
      const txs = await this.txRepo.find({
        where: { userId, categoryId: limit.categoryId, date: Between(from, now) },
      });
      const spent = txs.reduce((s, t) => s + Number(t.amount), 0);
      const pct = Math.round((spent / Number(limit.limitAmount)) * 100);
      results.push({
        id: limit.id,
        category: limit.category,
        limitAmount: Number(limit.limitAmount),
        spent,
        remaining: Number(limit.limitAmount) - spent,
        percentage: pct,
        status: pct >= 100 ? 'exceeded' : pct >= 80 ? 'warning' : 'ok',
      });
    }
    return results;
  }
}
