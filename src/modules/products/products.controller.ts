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

import { Public } from 'src/common/decorators/public.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { MongoIdParamDto } from 'src/common/dto/mongo-id-param.dto';
import { Role } from 'src/common/enums/role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStoreLinksDto } from './dto/update-store-links.dto';
import { ProductDeletionInterceptor } from './interceptors/product-deletion.interceptor';
import { ProductsService } from './products.service';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(Role.MUA)
  async create(@Req() req: Request, @Body() dto: CreateProductDto) {
    const authorId = req.user!.id;
    const product = await this.productsService.create({ ...dto, authorId });
    return { id: product.id };
  }

  @Post('duplicate/:id')
  @Roles(Role.MUA)
  async duplicate(@Param() params: MongoIdParamDto) {
    const product = await this.productsService.duplicate(params.id);
    return { id: product.id };
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.productsService.findAll();
  }

  @Get('mine')
  @Roles(Role.MUA)
  findAllByAuthor(@Req() req: Request) {
    const authorId = req.user!.id;
    return this.productsService.findAllByAuthor(authorId);
  }

  @Get('mine/category/:name')
  @Roles(Role.MUA)
  findAllByAuthorAndCategory(@Req() req: Request, @Param('name') name: string) {
    const authorId = req.user!.id;
    return this.productsService.findAllByAuthorAndCategory(authorId, name);
  }

  @Get(':id')
  @Public()
  findOne(@Param() params: MongoIdParamDto) {
    return this.productsService.findOne(params.id);
  }

  @Put(':id')
  @Roles(Role.MUA)
  async update(
    @Param() params: MongoIdParamDto,
    @Body() dto: UpdateProductDto,
  ) {
    const product = await this.productsService.update(params.id, dto);
    return { id: product.id };
  }

  @Patch(':id/store-links')
  @Roles(Role.MUA)
  async updateStoreLinks(
    @Param() params: MongoIdParamDto,
    @Body() dto: UpdateStoreLinksDto,
  ) {
    const product = await this.productsService.updateStoreLinks(params.id, dto);
    return { id: product.id };
  }

  @Delete(':id')
  @Roles(Role.MUA)
  @UseInterceptors(ProductDeletionInterceptor)
  async remove(@Param() params: MongoIdParamDto) {
    const product = await this.productsService.remove(params.id);
    return { id: product.id };
  }
}
