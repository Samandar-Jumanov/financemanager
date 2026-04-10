import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Or } from 'typeorm';
import { Category } from './category.entity';

const DEFAULT_CATEGORIES = [
  { name: 'Savdo',        type: 'income',  icon: '💰', isDefault: true },
  { name: 'Xizmat',       type: 'income',  icon: '🛠', isDefault: true },
  { name: 'Investitsiya', type: 'income',  icon: '📈', isDefault: true },
  { name: 'Qarz olindi',  type: 'income',  icon: '🤝', isDefault: true },
  { name: 'Boshqa kirim', type: 'income',  icon: '➕', isDefault: true },
  { name: 'Oziq-ovqat',   type: 'expense', icon: '🍽', isDefault: true },
  { name: 'Transport',    type: 'expense', icon: '🚗', isDefault: true },
  { name: 'Logistika',    type: 'expense', icon: '📦', isDefault: true },
  { name: 'Ijara',        type: 'expense', icon: '🏠', isDefault: true },
  { name: 'Maosh',        type: 'expense', icon: '👷', isDefault: true },
  { name: 'Marketing',    type: 'expense', icon: '📣', isDefault: true },
  { name: 'Kommunal',     type: 'expense', icon: '💡', isDefault: true },
  { name: 'Soliq',        type: 'expense', icon: '🏛', isDefault: true },
  { name: 'Boshqa chiqim',type: 'expense', icon: '➖', isDefault: true },
];

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private repo: Repository<Category>,
  ) {}

  /** Seed global default categories once on startup (userId = null = shared) */
  async seedDefaults() {
    for (const cat of DEFAULT_CATEGORIES) {
      const exists = await this.repo.findOne({ where: { name: cat.name, userId: IsNull() } });
      if (!exists) await this.repo.save(this.repo.create({ ...cat, userId: null } as any));
    }
  }

  /** Return user's custom categories + global defaults */
  findAll(userId: string) {
    return this.repo.find({
      where: [{ userId }, { userId: IsNull() }],
      order: { isDefault: 'ASC', type: 'ASC', name: 'ASC' },
    });
  }

  findOne(userId: string, id: string) {
    return this.repo.findOne({ where: [{ id, userId }, { id, userId: IsNull() }] });
  }

  async findByName(userId: string, name: string) {
    return this.repo.findOne({
      where: [{ name, userId }, { name, userId: IsNull() }],
    });
  }

  async create(userId: string, dto: { name: string; type: string; icon?: string }) {
    const cat = this.repo.create({ ...dto, userId, icon: dto.icon || '📦' } as any);
    return this.repo.save(cat);
  }

  async update(userId: string, id: string, dto: Partial<Category>) {
    // Only allow editing user-owned categories, not global defaults
    await this.repo.update({ id, userId }, dto as any);
    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string) {
    await this.repo.delete({ id, userId });
  }

  async guessCategory(userId: string, text: string, type: 'income' | 'expense'): Promise<Category | null> {
    const categories = await this.findAll(userId);
    const lower = text.toLowerCase();
    const keywords: Record<string, string[]> = {
      'Oziq-ovqat': ['ovqat','non','go\'sht','tushlik','kafe','restoran','lunch','food'],
      'Transport':  ['taxi','avto','benzin','yoqilg\'i','mashina','transport','yo\'l'],
      'Logistika':  ['yetkazib','pochta','logistics','delivery','dostavka','kuryer'],
      'Ijara':      ['ijara','rent','ofis','xona'],
      'Maosh':      ['maosh','oylik','salary','workers','ishchi'],
      'Marketing':  ['reklama','marketing','instagram','target','ads'],
      'Kommunal':   ['gaz','elektr','suv','internet','kommunal'],
      'Soliq':      ['soliq','tax','davlat'],
      'Savdo':      ['sotildi','sotuv','savdo','tovar','mahsulot','sale'],
      'Xizmat':     ['xizmat','service','ustoz','ish','vazifa'],
    };
    for (const [catName, words] of Object.entries(keywords)) {
      if (words.some(w => lower.includes(w))) {
        const found = categories.find(c => c.name === catName);
        if (found) return found;
      }
    }
    const defaultName = type === 'income' ? 'Boshqa kirim' : 'Boshqa chiqim';
    return categories.find(c => c.name === defaultName) || null;
  }
}
