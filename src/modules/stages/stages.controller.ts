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
} from '@nestjs/common';

import { Roles } from 'src/common/decorators/roles.decorator';
import { ObjectIdParamDto } from 'src/common/dto/object-id-param.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageProductsDto } from './dto/update-stage-products.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { StagesService } from './stages.service';

@Controller('stages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'mua')
export class StagesController {
  constructor(private readonly stagesService: StagesService) {}

  @Post()
  async create(@Body() dto: CreateStageDto) {
    const stage = await this.stagesService.create(dto);
    return { id: stage.id };
  }

  @Post('duplicate/:id')
  async duplicate(@Param() params: ObjectIdParamDto) {
    const stage = await this.stagesService.duplicate(params.id);
    return { id: stage.id };
  }

  @Get()
  findAll() {
    return this.stagesService.findAll();
  }

  @Get(':id')
  @Roles()
  findOne(@Param() params: ObjectIdParamDto) {
    return this.stagesService.findOne(params.id);
  }

  @Put(':id')
  async update(@Param() params: ObjectIdParamDto, @Body() dto: UpdateStageDto) {
    const stage = await this.stagesService.update(params.id, dto);
    return { id: stage.id };
  }

  @Patch(':id/products')
  async updateProducts(
    @Param() params: ObjectIdParamDto,
    @Body() dto: UpdateStageProductsDto,
  ) {
    const stage = await this.stagesService.updateProducts(params.id, dto);
    return { id: stage.id };
  }

  @Delete(':id')
  async remove(@Param() params: ObjectIdParamDto) {
    const stage = await this.stagesService.remove(params.id);
    return { id: stage.id };
  }
}
