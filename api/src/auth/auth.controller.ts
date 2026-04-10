import { Controller, Post, Get, Put, Body, Param, Request, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ schema: { example: { username: 'mycompany', password: 'pass123', email: 'me@co.uz', fullName: 'Ali V', company: 'Savdo LLC' } } })
  register(@Body() body: any) { return this.auth.register(body); }

  @Post('login')
  @ApiOperation({ summary: 'Login' })
  login(@Body() body: { username: string; password: string }) {
    return this.auth.login(body.username, body.password);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@Request() req: any) { return this.auth.getProfile(req.user.id); }

  @Put('profile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update profile' })
  updateProfile(@Request() req: any, @Body() body: any) {
    return this.auth.updateProfile(req.user.id, body);
  }

  @Put('change-password')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Change password' })
  changePassword(@Request() req: any, @Body() body: { oldPassword: string; newPassword: string }) {
    return this.auth.changePassword(req.user.id, body.oldPassword, body.newPassword);
  }

  // ── Telegram link endpoints ──────────────────────────────────────────────

  /** Dashboard calls this → returns a 15-min token → user sends /link <token> to bot */
  @Post('telegram-link-token')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Generate a 15-min Telegram link token' })
  generateLinkToken(@Request() req: any) {
    const token = this.auth.generateLinkToken(req.user.id);
    return { token };
  }

  /**
   * Bot calls this endpoint (with no auth — uses the link token itself as proof).
   * Body: { linkToken: string; telegramId: string }
   * Returns: { ok: true, botToken: string } — a long-lived JWT the bot stores per user.
   */
  @Post('telegram-link')
  @ApiOperation({ summary: 'Bot calls this to complete account linking' })
  @ApiBody({ schema: { example: { linkToken: 'eyJ...', telegramId: '123456789' } } })
  async linkTelegram(@Body() body: { linkToken: string; telegramId: string }) {
    const userId = this.auth.verifyLinkToken(body.linkToken);
    if (!userId) throw new UnauthorizedException('Token noto\'g\'ri yoki muddati o\'tgan');
    const result = await this.auth.linkTelegram(userId, body.telegramId);
    if (!result.ok) throw new UnauthorizedException('Bu Telegram hisob boshqa foydalanuvchiga ulangan');
    const botToken = this.auth.signForBot(userId);
    return { ok: true, username: result.username, botToken };
  }

  /** Bot calls this to get a JWT for a user who was already linked */
  @Post('telegram-login')
  @ApiOperation({ summary: 'Bot calls this to get a JWT by Telegram ID (already linked users)' })
  @ApiBody({ schema: { example: { telegramId: '123456789', botSecret: 'secret' } } })
  async telegramLogin(@Body() body: { telegramId: string; botSecret: string }) {
    // Validate that the caller is the bot (shared secret in env)
    const secret = process.env.BOT_INTERNAL_SECRET || 'financebot_internal';
    if (body.botSecret !== secret) throw new UnauthorizedException('Forbidden');
    const user = await this.auth.findByTelegramId(body.telegramId);
    if (!user) return { found: false };
    return { found: true, botToken: this.auth.signForBot(user.id) };
  }

  /** Dashboard calls this to remove telegramId from their account */
  @Post('telegram-unlink')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Unlink Telegram from current account' })
  async unlinkTelegram(@Request() req: any) {
    await this.auth.unlinkTelegram(req.user.id);
    return { ok: true };
  }
}