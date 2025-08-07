import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { BrandsService } from './brands.service';
import { BrandParamsDto } from './dto/brand-params.dto';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Controller('brands')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateBrandDto) {
    const brand = await this.brandsService.create(dto);

    return {
      id: brand.id,
      message: 'Brand created successfully',
    };
  }

  @Get()
  @Roles('admin', 'mua')
  findAll() {
    return this.brandsService.findAll();
  }

  @Put(':id')
  @Roles('admin')
  async update(@Param() params: BrandParamsDto, @Body() dto: UpdateBrandDto) {
    const brand = await this.brandsService.update(params.id, dto);

    return {
      id: brand.id,
      message: 'Brand updated successfully',
    };
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param() params: BrandParamsDto) {
    const brand = await this.brandsService.remove(params.id);

    return {
      id: brand.id,
      message: 'Brand deleted successfully',
    };
  }
}
