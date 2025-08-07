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
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
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
  findAll() {
    return this.storesService.findAll();
  }

  @Put(':id')
  @Roles('admin')
  async update(@Param() params: StoreParamsDto, @Body() dto: UpdateStoreDto) {
    const store = await this.storesService.update(params.id, dto);

    return {
      id: store.id,
      message: 'Store updated successfully',
    };
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param() params: StoreParamsDto) {
    const store = await this.storesService.remove(params.id);

    return {
      id: store.id,
      message: 'Store deleted successfully',
    };
  }
}
