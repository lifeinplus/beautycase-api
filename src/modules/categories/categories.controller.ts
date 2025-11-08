import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { Roles } from 'src/common/decorators/roles.decorator';
import { MongoIdParamDto } from 'src/common/dto/mongo-id-param.dto';
import { Role } from 'src/common/enums/role.enum';
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
  @Roles(Role.ADMIN)
  async create(@Body() dto: CreateCategoryDto) {
    const category = await this.categoriesService.create(dto);
    return { id: category.id };
  }

  @Get()
  @Roles(Role.ADMIN, Role.MUA)
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get('makeup-bags')
  @Roles(Role.ADMIN, Role.MUA)
  findMakeupBags() {
    return this.categoriesService.findMakeupBags();
  }

  @Get('products')
  @Roles(Role.ADMIN, Role.MUA)
  findProducts() {
    return this.categoriesService.findProducts();
  }

  @Get('products/mine/with-counts')
  @Roles(Role.MUA)
  findProductsWithCountsByAuthor(@Req() req: Request) {
    const authorId = req.user!.id;
    return this.categoriesService.findProductsWithCountsByAuthor(authorId);
  }

  @Get('products/with-counts')
  @Roles(Role.ADMIN, Role.MUA)
  findProductsWithCounts() {
    return this.categoriesService.findProductsWithCounts();
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  async update(
    @Param() params: MongoIdParamDto,
    @Body() dto: UpdateCategoryDto,
  ) {
    const brand = await this.categoriesService.update(params.id, dto);
    return { id: brand.id };
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param() params: MongoIdParamDto) {
    const category = await this.categoriesService.remove(params.id);
    return { id: category.id };
  }
}
