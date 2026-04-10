import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CategoriesService } from './categories.service';

@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories (user-owned + global defaults)' })
  findAll(@Request() req: any) {
    return this.service.findAll(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a custom category for current user' })
  create(@Request() req: any, @Body() dto: { name: string; type: string; icon?: string }) {
    return this.service.create(req.user.id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a user-owned category' })
  @ApiParam({ name: 'id' })
  update(@Request() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.service.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user-owned category' })
  @ApiParam({ name: 'id' })
  remove(@Request() req: any, @Param('id') id: string) {
    return this.service.remove(req.user.id, id);
  }
}
