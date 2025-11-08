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
import { MongoIdParamDto } from 'src/common/dto/mongo-id-param.dto';
import { Role } from 'src/common/enums/role.enum';
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
  @Roles(Role.ADMIN)
  async create(@Body() dto: CreateBrandDto) {
    const brand = await this.brandsService.create(dto);
    return { id: brand.id };
  }

  @Get()
  @Roles(Role.ADMIN, Role.MUA)
  findAll() {
    return this.brandsService.findAll();
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  async update(@Param() params: MongoIdParamDto, @Body() dto: UpdateBrandDto) {
    const brand = await this.brandsService.update(params.id, dto);
    return { id: brand.id };
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param() params: MongoIdParamDto) {
    const brand = await this.brandsService.remove(params.id);
    return { id: brand.id };
  }
}
