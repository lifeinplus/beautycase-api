import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CreateMakeupBagDto } from './dto/create-makeup-bag.dto';
import { MakeupBagParamsDto } from './dto/makeup-bag-params.dto';
import { UpdateMakeupBagDto } from './dto/update-makeup-bag.dto';
import { MakeupBagAccessGuard } from './guards/makeup-bag-access.guard';
import { MakeupBagsService } from './makeup-bags.service';

@Controller('makeup-bags')
@UseGuards(JwtAuthGuard)
export class MakeupBagsController {
  constructor(private readonly makeupBagsService: MakeupBagsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'mua')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createMakeupBagDto: CreateMakeupBagDto) {
    const makeupBag = await this.makeupBagsService.create(createMakeupBagDto);

    return {
      id: makeupBag.id,
      message: 'MakeupBag created successfully',
    };
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'mua')
  async getAll() {
    return await this.makeupBagsService.getAll();
  }

  @Get(':id')
  @UseGuards(MakeupBagAccessGuard)
  async getById(@Param() params: MakeupBagParamsDto) {
    return await this.makeupBagsService.getById(params.id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'mua')
  async updateById(
    @Param() params: MakeupBagParamsDto,
    @Body() updateMakeupBagDto: UpdateMakeupBagDto,
  ) {
    const makeupBag = await this.makeupBagsService.updateById(
      params.id,
      updateMakeupBagDto,
    );

    return {
      id: makeupBag.id,
      message: 'MakeupBag updated successfully',
    };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'mua')
  async deleteById(@Param() params: MakeupBagParamsDto) {
    const makeupBag = await this.makeupBagsService.deleteById(params.id);

    return {
      id: makeupBag.id,
      message: 'MakeupBag deleted successfully',
    };
  }
}
