import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from './user.entity';
import * as crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'financebot_salt').digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private users: Repository<User>,
    private jwt: JwtService,
  ) {}

  private sign(user: User) {
    const payload = { sub: user.id, username: user.username, role: user.role };
    return {
      access_token: this.jwt.sign(payload),
      user: {
        id: user.id, username: user.username, email: user.email,
        fullName: user.fullName, company: user.company,
        plan: user.plan, role: user.role,
        telegramId: user.telegramId,
        createdAt: user.createdAt,
      },
    };
  }

  async register(dto: { username: string; password: string; email?: string; fullName?: string; company?: string }) {
    const existing = await this.users.findOne({ where: { username: dto.username } });
    if (existing) throw new ConflictException('Bu username band');
    if (dto.email) {
      const emailExists = await this.users.findOne({ where: { email: dto.email } });
      if (emailExists) throw new ConflictException('Bu email band');
    }
    const user = this.users.create({ ...dto, password: hashPassword(dto.password), plan: 'free', role: 'admin' });
    await this.users.save(user);
    return this.sign(user);
  }

  async login(username: string, password: string) {
    const user = await this.users.findOne({ where: { username } });
    if (user && user.password === hashPassword(password)) return this.sign(user);

    // Fallback: env-based admin
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
    if (username === adminUser && password === adminPass) {
      let admin = await this.users.findOne({ where: { username: adminUser } });
      if (!admin) {
        admin = this.users.create({ username: adminUser, password: hashPassword(adminPass), plan: 'pro', role: 'admin', fullName: 'Administrator' });
        await this.users.save(admin);
      }
      return this.sign(admin);
    }
    throw new UnauthorizedException("Login yoki parol noto'g'ri");
  }

  async getProfile(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) return null;
    const { password, ...safe } = user as any;
    return safe;
  }

  async updateProfile(userId: string, dto: { fullName?: string; company?: string; email?: string }) {
    await this.users.update(userId, dto);
    return this.getProfile(userId);
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user || user.password !== hashPassword(oldPassword)) throw new UnauthorizedException("Joriy parol noto'g'ri");
    await this.users.update(userId, { password: hashPassword(newPassword) });
    return { success: true };
  }

  // ── Telegram linking ────────────────────────────────────────────────────────

  /** Generate a short-lived (15 min) token the user pastes into the bot as /link <token> */
  generateLinkToken(userId: string): string {
    return this.jwt.sign({ sub: userId, purpose: 'telegram_link' }, { expiresIn: '15m' });
  }

  /** Verify link token, return userId or null */
  verifyLinkToken(token: string): string | null {
    try {
      const payload = this.jwt.verify(token) as any;
      if (payload.purpose !== 'telegram_link') return null;
      return payload.sub;
    } catch { return null; }
  }

  /** Called by bot after /link — save telegramId on user row */
  async linkTelegram(userId: string, telegramId: string): Promise<{ ok: boolean; username?: string }> {
    // Check not already taken by another user
    const existing = await this.users.findOne({ where: { telegramId } });
    if (existing && existing.id !== userId) return { ok: false };
    await this.users.update(userId, { telegramId });
    const user = await this.users.findOne({ where: { id: userId } });
    return { ok: true, username: user?.username };
  }

  /** Find user by their Telegram ID — used by bot apiClient */
  async findByTelegramId(telegramId: string): Promise<User | null> {
    return this.users.findOne({ where: { telegramId } });
  }

  /** Return a long-lived JWT for a user — issued to bot after successful /link */
  signForBot(userId: string): string {
    const user = { id: userId } as User;
    const payload = { sub: userId, source: 'bot' };
    return this.jwt.sign(payload, { expiresIn: '365d' });
  }

  async unlinkTelegram(userId: string): Promise<void> {
    // Fetch the telegramId before we erase it — needed for the evict call
    const user = await this.users.findOne({ where: { id: userId } });
    const telegramId = user?.telegramId;

    await this.users.update(userId, { telegramId: null as any });

    // Fire-and-forget: tell the bot to evict the cached JWT so
    // the user can't keep making API calls after unlinking from dashboard
    if (telegramId) {
      const botUrl = process.env.BOT_URL || 'http://localhost:3002';
      const secret = process.env.BOT_INTERNAL_SECRET || 'financebot_internal';
      // Use dynamic import so the API doesn't need axios as a dep at the top level
      import('axios').then(({ default: axios }) =>
        axios.post(`${botUrl}/evict-token`, { telegramId: String(telegramId), secret }, { timeout: 3000 })
      ).catch(() => { /* non-critical — bot will auto-evict on next token refresh */ });
    }
  }

}