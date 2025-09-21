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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles('admin')
  async create(@Body() dto: CreateCategoryDto) {
    const category = await this.categoriesService.create(dto);

    return {
      id: category.id,
      message: 'Category created successfully',
    };
  }

  @Get()
  @Roles('admin', 'mua')
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get('makeup-bags')
  @Roles('admin', 'mua')
  findMakeupBags() {
    return this.categoriesService.findMakeupBags();
  }

  @Get('products')
  @Roles('admin', 'mua')
  findProducts() {
    return this.categoriesService.findProducts();
  }

  @Get('products/with-counts')
  @Roles('admin', 'mua')
  findProductsWithCounts() {
    return this.categoriesService.findProductsWithCounts();
  }

  @Put(':id')
  @Roles('admin')
  async update(
    @Param() params: ObjectIdParamDto,
    @Body() dto: UpdateCategoryDto,
  ) {
    const brand = await this.categoriesService.update(params.id, dto);

    return {
      id: brand.id,
      message: 'Category updated successfully',
    };
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param() params: ObjectIdParamDto) {
    const category = await this.categoriesService.remove(params.id);

    return {
      id: category.id,
      message: 'Category deleted successfully',
    };
  }
}
