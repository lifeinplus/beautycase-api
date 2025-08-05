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
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductParamsDto } from './dto/product-params.dto';
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
  getAll() {
    return this.productsService.getAll();
  }

  @Get(':id')
  @Roles()
  getById(@Param() params: ProductParamsDto) {
    return this.productsService.getById(params.id);
  }

  @Put(':id')
  async updateById(
    @Param() params: ProductParamsDto,
    @Body() dto: UpdateProductDto,
  ) {
    const product = await this.productsService.updateById(params.id, dto);

    return {
      id: product.id,
      message: 'Product updated successfully',
    };
  }

  @Patch(':id/store-links')
  async updateStoreLinks(
    @Param() params: ProductParamsDto,
    @Body() dto: UpdateStoreLinksDto,
  ) {
    const product = await this.productsService.updateStoreLinks(params.id, dto);

    return {
      id: product.id,
      message: 'Product store links updated successfully',
    };
  }

  @Delete(':id')
  async deleteById(@Param() params: ProductParamsDto) {
    const product = await this.productsService.deleteById(params.id);

    return {
      id: product.id,
      message: 'Product deleted successfully',
    };
  }
}
