import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { BudgetService } from './budget.service';

@ApiTags('budgets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetController {
  constructor(private readonly service: BudgetService) {}

  @Get()
  @ApiOperation({ summary: 'Get all budget limits for current user' })
  findAll(@Request() req: any) {
    return this.service.findAll(req.user.id);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get current month budget status for current user' })
  getStatus(@Request() req: any) {
    return this.service.getStatus(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create or update a budget limit for a category' })
  create(@Request() req: any, @Body() dto: { categoryId: string; limitAmount: number; period?: string }) {
    return this.service.create(req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a budget limit' })
  @ApiParam({ name: 'id' })
  remove(@Request() req: any, @Param('id') id: string) {
    return this.service.remove(req.user.id, id);
  }
}
