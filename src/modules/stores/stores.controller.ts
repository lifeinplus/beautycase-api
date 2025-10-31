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
import { Role } from 'src/common/enums/role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoresService } from './stores.service';

@Controller('stores')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() dto: CreateStoreDto) {
    const store = await this.storesService.create(dto);
    return { id: store.id };
  }

  @Get()
  @Roles(Role.ADMIN, Role.MUA)
  findAll() {
    return this.storesService.findAll();
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  async update(@Param() params: ObjectIdParamDto, @Body() dto: UpdateStoreDto) {
    const store = await this.storesService.update(params.id, dto);
    return { id: store.id };
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param() params: ObjectIdParamDto) {
    const store = await this.storesService.remove(params.id);
    return { id: store.id };
  }
}
