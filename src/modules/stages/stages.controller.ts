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
} from '@nestjs/common';

import { Request } from 'express';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ObjectIdParamDto } from 'src/common/dto/object-id-param.dto';
import { Role } from 'src/common/enums/role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageProductsDto } from './dto/update-stage-products.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { StagesService } from './stages.service';

@Controller('stages')
@UseGuards(JwtAuthGuard)
export class StagesController {
  constructor(private readonly stagesService: StagesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.MUA)
  async create(@Req() req: Request, @Body() dto: CreateStageDto) {
    const authorId = req.user!.id;
    const stage = await this.stagesService.create({ ...dto, authorId });
    return { id: stage.id };
  }

  @Post('duplicate/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.MUA)
  async duplicate(@Param() params: ObjectIdParamDto) {
    const stage = await this.stagesService.duplicate(params.id);
    return { id: stage.id };
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findAll() {
    return this.stagesService.findAll();
  }

  @Get('mine')
  @UseGuards(RolesGuard)
  @Roles(Role.MUA)
  findAllByMua(@Req() req: Request) {
    const muaId = req.user!.id;
    return this.stagesService.findAllByMua(muaId);
  }

  // TODO: @UseGuards(StageAccessGuard)
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.MUA)
  findOne(@Param() params: ObjectIdParamDto) {
    return this.stagesService.findOne(params.id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.MUA)
  async update(@Param() params: ObjectIdParamDto, @Body() dto: UpdateStageDto) {
    const stage = await this.stagesService.update(params.id, dto);
    return { id: stage.id };
  }

  @Patch(':id/products')
  @UseGuards(RolesGuard)
  @Roles(Role.MUA)
  async updateProducts(
    @Param() params: ObjectIdParamDto,
    @Body() dto: UpdateStageProductsDto,
  ) {
    const stage = await this.stagesService.updateProducts(params.id, dto);
    return { id: stage.id };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.MUA)
  async remove(@Param() params: ObjectIdParamDto) {
    const stage = await this.stagesService.remove(params.id);
    return { id: stage.id };
  }
}
