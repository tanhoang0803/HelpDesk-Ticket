import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AgentRole } from '../common/enums/agent-role.enum';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private service: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List categories' })
  findAll(@Query('departmentId') departmentId?: string) {
    return this.service.findAll(departmentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id);
  }

  @Post()
  @Roles(AgentRole.ADMIN)
  @ApiOperation({ summary: 'Create category (Admin only)' })
  create(@Body() dto: CreateCategoryDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles(AgentRole.ADMIN)
  @ApiOperation({ summary: 'Update category (Admin only)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateCategoryDto) {
    return this.service.update(id, dto);
  }
}
