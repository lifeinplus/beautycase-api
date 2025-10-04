import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { Roles } from 'src/common/decorators/roles.decorator';
import { ObjectIdParamDto } from 'src/common/dto/object-id-param.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateStoreLinksDto } from './dto/update-store-links.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import { ToolDeletionInterceptor } from './interceptors/tool-deletion.interceptor';
import { ToolsService } from './tools.service';

@Controller('tools')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'mua')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Post()
  async create(@Body() dto: CreateToolDto) {
    const tool = await this.toolsService.create(dto);
    return { id: tool.id };
  }

  @Get()
  findAll() {
    return this.toolsService.findAll();
  }

  @Get(':id')
  @Roles()
  findOne(@Param() params: ObjectIdParamDto) {
    return this.toolsService.findOne(params.id);
  }

  @Put(':id')
  async update(@Param() params: ObjectIdParamDto, @Body() dto: UpdateToolDto) {
    const tool = await this.toolsService.update(params.id, dto);
    return { id: tool.id };
  }

  @Patch(':id/store-links')
  async updateStoreLinks(
    @Param() params: ObjectIdParamDto,
    @Body() dto: UpdateStoreLinksDto,
  ) {
    const tool = await this.toolsService.updateStoreLinks(params.id, dto);
    return { id: tool.id };
  }

  @Delete(':id')
  @UseInterceptors(ToolDeletionInterceptor)
  async remove(@Param() params: ObjectIdParamDto) {
    const tool = await this.toolsService.remove(params.id);
    return { id: tool.id };
  }
}
