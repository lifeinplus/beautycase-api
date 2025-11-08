import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';

import { Roles } from 'src/common/decorators/roles.decorator';
import { MongoIdParamDto } from 'src/common/dto/mongo-id-param.dto';
import { Role } from 'src/common/enums/role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateStoreLinksDto } from './dto/update-store-links.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import { ToolDeletionInterceptor } from './interceptors/tool-deletion.interceptor';
import { ToolsService } from './tools.service';

@Controller('tools')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Post()
  @Roles(Role.MUA)
  async create(@Req() req: Request, @Body() dto: CreateToolDto) {
    const authorId = req.user!.id;
    const tool = await this.toolsService.create({ ...dto, authorId });
    return { id: tool.id };
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.toolsService.findAll();
  }

  @Get('mine')
  @Roles(Role.MUA)
  findAllByAuthor(@Req() req: Request) {
    const authorId = req.user!.id;
    return this.toolsService.findAllByAuthor(authorId);
  }

  @Get(':id')
  @Roles()
  findOne(@Param() params: MongoIdParamDto) {
    return this.toolsService.findOne(params.id);
  }

  @Put(':id')
  @Roles(Role.MUA)
  async update(@Param() params: MongoIdParamDto, @Body() dto: UpdateToolDto) {
    const tool = await this.toolsService.update(params.id, dto);
    return { id: tool.id };
  }

  @Patch(':id/store-links')
  @Roles(Role.MUA)
  async updateStoreLinks(
    @Param() params: MongoIdParamDto,
    @Body() dto: UpdateStoreLinksDto,
  ) {
    const tool = await this.toolsService.updateStoreLinks(params.id, dto);
    return { id: tool.id };
  }

  @Delete(':id')
  @Roles(Role.MUA)
  @UseInterceptors(ToolDeletionInterceptor)
  async remove(@Param() params: MongoIdParamDto) {
    const tool = await this.toolsService.remove(params.id);
    return { id: tool.id };
  }
}
