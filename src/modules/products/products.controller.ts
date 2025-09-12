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
import { MongoIdParamDto } from 'src/common/dto/mongo-id-param.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStoreLinksDto } from './dto/update-store-links.dto';
import { ProductsService } from './products.service';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'mua')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  async create(@Body() dto: CreateProductDto) {
    const product = await this.productsService.create(dto);

    return {
      id: product.id,
      message: 'Product created successfully',
    };
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get('without-category')
  findWithoutCategory() {
    return this.productsService.findWithoutCategory();
  }

  @Get(':id')
  @Roles()
  findOne(@Param() params: MongoIdParamDto) {
    return this.productsService.findOne(params.id);
  }

  @Get('category/:name')
  findByCategory(@Param('name') name: string) {
    return this.productsService.findByCategory(name);
  }

  @Put(':id')
  async update(
    @Param() params: MongoIdParamDto,
    @Body() dto: UpdateProductDto,
  ) {
    const product = await this.productsService.update(params.id, dto);

    return {
      id: product.id,
      message: 'Product updated successfully',
    };
  }

  @Patch(':id/store-links')
  async updateStoreLinks(
    @Param() params: MongoIdParamDto,
    @Body() dto: UpdateStoreLinksDto,
  ) {
    const product = await this.productsService.updateStoreLinks(params.id, dto);

    return {
      id: product.id,
      message: 'Product store links updated successfully',
    };
  }

  @Delete(':id')
  async remove(@Param() params: MongoIdParamDto) {
    const product = await this.productsService.remove(params.id);

    return {
      id: product.id,
      message: 'Product deleted successfully',
    };
  }
}
