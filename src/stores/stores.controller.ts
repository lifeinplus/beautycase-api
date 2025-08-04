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

import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateStoreDto } from './dto/create-store.dto';
import { StoreParamsDto } from './dto/store-params.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoresService } from './stores.service';

@Controller('stores')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @Roles('admin')
  async create(@Body() dto: CreateStoreDto) {
    const store = await this.storesService.create(dto);

    return {
      id: store.id,
      message: 'Store created successfully',
    };
  }

  @Get()
  @Roles('admin', 'mua')
  getAll() {
    return this.storesService.getAll();
  }

  @Put(':id')
  @Roles('admin')
  async updateById(
    @Param() params: StoreParamsDto,
    @Body() dto: UpdateStoreDto,
  ) {
    const store = await this.storesService.updateById(params.id, dto);

    return {
      id: store.id,
      message: 'Store updated successfully',
    };
  }

  @Delete(':id')
  @Roles('admin')
  async deleteById(@Param() params: StoreParamsDto) {
    const store = await this.storesService.deleteById(params.id);

    return {
      id: store.id,
      message: 'Store deleted successfully',
    };
  }
}
