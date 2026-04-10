import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { TransactionsService } from './transactions.service';

// ── Per-user SSE client registry ─────────────────────────────────────────────
// Map<userId, Set<Response>>
const SseClients = new Map<string, Set<Response>>();

export function broadcastToUser(userId: string, payload: object) {
  const clients = SseClients.get(userId);
  if (!clients) return;
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  clients.forEach(client => {
    try { client.write(data); } catch { clients.delete(client); }
  });
}

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated transactions for current user' })
  @ApiQuery({ name: 'type',       required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'from',       required: false })
  @ApiQuery({ name: 'to',         required: false })
  @ApiQuery({ name: 'search',     required: false })
  @ApiQuery({ name: 'page',       required: false })
  @ApiQuery({ name: 'limit',      required: false })
  findAll(@Request() req: any, @Query() filters: any) {
    return this.service.findAll(req.user.id, filters);
  }

  @Get('stream')
  @ApiOperation({ summary: 'SSE real-time stream — scoped to current user' })
  stream(@Request() req: any, @Res() res: Response) {
    const userId = req.user.id;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    // CORS header matches main app (not wildcard, which breaks credentialed SSE)
    const origin = req.headers.origin;
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.flushHeaders();

    // Register this client under the user's bucket
    if (!SseClients.has(userId)) SseClients.set(userId, new Set());
    SseClients.get(userId)!.add(res);

    // Send initial stats
    this.service.getStats(userId, 'month').then(stats => {
      res.write(`data: ${JSON.stringify({ type: 'connected', stats })}\n\n`);
    }).catch(() => {});

    const heartbeat = setInterval(() => {
      try { res.write(': heartbeat\n\n'); } catch { clearInterval(heartbeat); }
    }, 25000);

    res.on('close', () => {
      clearInterval(heartbeat);
      SseClients.get(userId)?.delete(res);
    });
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Download transactions as CSV (current user only)' })
  async exportCsv(@Request() req: any, @Query() filters: any, @Res() res: Response) {
    const csv = await this.service.exportCsv(req.user.id, filters);
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="tranzaksiyalar-${date}.csv"`);
    res.send('\uFEFF' + csv);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get income/expense stats for current user' })
  @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'year'] })
  getStats(@Request() req: any, @Query('period') period: any) {
    return this.service.getStats(req.user.id, period || 'month');
  }

  @Get('chart')
  @ApiOperation({ summary: 'Get chart data for current user' })
  @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'year'] })
  getChart(@Request() req: any, @Query('period') period: any) {
    return this.service.getChartData(req.user.id, period || 'month');
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.service.findOne(req.user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a transaction (web — current user)' })
  async create(@Request() req: any, @Body() dto: any) {
    const tx = await this.service.create({ ...dto, userId: req.user.id });
    broadcastToUser(req.user.id, { type: 'transaction', payload: tx });
    return tx;
  }

  @Put(':id')
  async update(@Request() req: any, @Param('id') id: string, @Body() dto: any) {
    const tx = await this.service.update(req.user.id, id, dto);
    broadcastToUser(req.user.id, { type: 'transaction', payload: tx });
    return tx;
  }

  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
    await this.service.remove(req.user.id, id);
    broadcastToUser(req.user.id, { type: 'deleted', id });
  }
}
