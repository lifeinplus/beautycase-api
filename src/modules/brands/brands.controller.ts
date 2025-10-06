import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { Roles } from 'src/common/decorators/roles.decorator';
import { ObjectIdParamDto } from 'src/common/dto/object-id-param.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Controller('brands')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @Roles('admin')
  async create(@Body() dto: CreateBrandDto) {
    const brand = await this.brandsService.create(dto);
    return { id: brand.id };
  }

  @Get()
  @Roles('admin', 'mua')
  findAll() {
    return this.brandsService.findAll();
  }

  @Put(':id')
  @Roles('admin')
  async update(@Param() params: ObjectIdParamDto, @Body() dto: UpdateBrandDto) {
    const brand = await this.brandsService.update(params.id, dto);
    return { id: brand.id };
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param() params: ObjectIdParamDto) {
    const brand = await this.brandsService.remove(params.id);
    return { id: brand.id };
  }
}
