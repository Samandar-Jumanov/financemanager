import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Transaction } from './transaction.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private repo: Repository<Transaction>,
  ) {}

  async create(dto: {
    userId: string;
    amount: number;
    type: 'income' | 'expense';
    categoryId?: string;
    note?: string;
    source?: string;
    telegramMessageId?: number;
    date?: Date;
  }) {
    const tx = this.repo.create({ ...dto, date: dto.date || new Date() } as any);
    return this.repo.save(tx);
  }

  async findAll(userId: string, filters?: {
    type?: string;
    categoryId?: string;
    from?: string;
    to?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page  = Math.max(1, Number(filters?.page  || 1));
    const limit = Math.min(200, Math.max(1, Number(filters?.limit || 50)));

    const q = this.repo.createQueryBuilder('tx')
      .leftJoinAndSelect('tx.category', 'category')
      .where('tx.user_id = :userId', { userId })
      .orderBy('tx.date', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filters?.type)       q.andWhere('tx.type = :type', { type: filters.type });
    if (filters?.categoryId) q.andWhere('tx.category_id = :cid', { cid: filters.categoryId });
    if (filters?.from)       q.andWhere('tx.date >= :from', { from: new Date(filters.from) });
    if (filters?.to)         q.andWhere('tx.date <= :to',   { to: new Date(filters.to) });
    if (filters?.search)     q.andWhere('(LOWER(COALESCE(tx.note,\'\')) LIKE :s OR LOWER(COALESCE(category.name,\'\')) LIKE :s)', { s: `%${filters.search.toLowerCase()}%` });

    const [data, total] = await q.getManyAndCount();
    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findAllForExport(userId: string, filters?: {
    type?: string; categoryId?: string; from?: string; to?: string;
  }) {
    const q = this.repo.createQueryBuilder('tx')
      .leftJoinAndSelect('tx.category', 'category')
      .where('tx.user_id = :userId', { userId })
      .orderBy('tx.date', 'DESC');

    if (filters?.type)       q.andWhere('tx.type = :type', { type: filters.type });
    if (filters?.categoryId) q.andWhere('tx.category_id = :cid', { cid: filters.categoryId });
    if (filters?.from)       q.andWhere('tx.date >= :from', { from: new Date(filters.from) });
    if (filters?.to)         q.andWhere('tx.date <= :to',   { to: new Date(filters.to) });

    return q.getMany();
  }

  async findOne(userId: string, id: string) {
    return this.repo.findOne({ where: { id, userId }, relations: ['category'] });
  }

  async update(userId: string, id: string, dto: any) {
    await this.repo.update({ id, userId }, dto);
    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string) {
    await this.repo.delete({ id, userId });
  }

  async getStats(userId: string, period: 'week' | 'month' | 'year' = 'month') {
    const now = new Date();
    let from: Date, prevFrom: Date, prevTo: Date;

    if (period === 'week') {
      const day = now.getDay();
      const diffToMon = day === 0 ? -6 : 1 - day;
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMon);
      from.setHours(0, 0, 0, 0);
      prevFrom = new Date(from); prevFrom.setDate(prevFrom.getDate() - 7);
      prevTo   = new Date(from); prevTo.setDate(prevTo.getDate() - 1); prevTo.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
      from     = new Date(now.getFullYear(), now.getMonth(), 1);
      prevFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevTo   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else {
      from     = new Date(now.getFullYear(), 0, 1);
      prevFrom = new Date(now.getFullYear() - 1, 0, 1);
      prevTo   = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
    }

    const current  = await this.repo.find({ where: { userId, date: Between(from, now) }, relations: ['category'] });
    const previous = await this.repo.find({ where: { userId, date: Between(prevFrom, prevTo) }, relations: ['category'] });

    const sum = (txs: Transaction[], type: string) =>
      txs.filter(t => t.type === type).reduce((s, t) => s + Number(t.amount), 0);

    return {
      income:           sum(current, 'income'),
      expenses:         sum(current, 'expense'),
      net:              sum(current, 'income') - sum(current, 'expense'),
      prevIncome:       sum(previous, 'income'),
      prevExpenses:     sum(previous, 'expense'),
      prevNet:          sum(previous, 'income') - sum(previous, 'expense'),
      transactionCount: current.length,
      transactions:     current,
    };
  }

  async getChartData(userId: string, period: 'week' | 'month' | 'year' = 'month') {
    const now = new Date();
    let from: Date;

    if (period === 'week') {
      const day = now.getDay();
      const diffToMon = day === 0 ? -6 : 1 - day;
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMon);
      from.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      from = new Date(now.getFullYear(), 0, 1);
    }

    const txs = await this.repo.find({
      where: { userId, date: Between(from, now) },
      relations: ['category'],
      order: { date: 'ASC' },
    });

    const dailyMap: Record<string, { income: number; expense: number; date: string }> = {};
    for (const tx of txs) {
      const key = new Date(tx.date).toISOString().split('T')[0];
      if (!dailyMap[key]) dailyMap[key] = { income: 0, expense: 0, date: key };
      dailyMap[key][tx.type === 'income' ? 'income' : 'expense'] += Number(tx.amount);
    }

    const catMap: Record<string, { name: string; icon: string; value: number; type: string }> = {};
    for (const tx of txs) {
      const key = tx.categoryId || 'unknown';
      if (!catMap[key]) catMap[key] = {
        name: tx.category?.name || 'Boshqa',
        icon: tx.category?.icon || '📦',
        value: 0,
        type: tx.type,
      };
      catMap[key].value += Number(tx.amount);
    }

    return {
      daily:      Object.values(dailyMap),
      byCategory: Object.values(catMap).sort((a, b) => b.value - a.value),
    };
  }

  async exportCsv(userId: string, filters?: {
    type?: string; categoryId?: string; from?: string; to?: string;
  }): Promise<string> {
    const txs = await this.findAllForExport(userId, filters);
    const header = ['ID', 'Tur', 'Miqdor (UZS)', 'Kategoriya', 'Izoh', 'Manba', 'Sana'];
    const rows = txs.map(tx => [
      tx.id,
      tx.type === 'income' ? 'Kirim' : 'Chiqim',
      Number(tx.amount).toFixed(0),
      tx.category?.name || '',
      (tx.note || '').replace(/"/g, '""'),
      tx.source || 'web',
      new Date(tx.date).toISOString().replace('T', ' ').slice(0, 19),
    ]);
    return [header, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\r\n');
  }

  async getRecentForUser(userId: string, limit = 5) {
    return this.repo.find({
      where: { userId },
      relations: ['category'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
