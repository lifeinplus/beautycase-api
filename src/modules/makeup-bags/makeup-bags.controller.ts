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
import { CreateMakeupBagDto } from './dto/create-makeup-bag.dto';
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
  async create(@Body() dto: CreateMakeupBagDto) {
    const makeupBag = await this.makeupBagsService.create(dto);

    return {
      id: makeupBag.id,
      message: 'MakeupBag created successfully',
    };
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'mua')
  findAll() {
    return this.makeupBagsService.findAll();
  }

  @Get(':id')
  @UseGuards(MakeupBagAccessGuard)
  findOne(@Param() params: ObjectIdParamDto) {
    return this.makeupBagsService.findOne(params.id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'mua')
  async update(
    @Param() params: ObjectIdParamDto,
    @Body() dto: UpdateMakeupBagDto,
  ) {
    const makeupBag = await this.makeupBagsService.update(params.id, dto);

    return {
      id: makeupBag.id,
      message: 'MakeupBag updated successfully',
    };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'mua')
  async remove(@Param() params: ObjectIdParamDto) {
    const makeupBag = await this.makeupBagsService.remove(params.id);

    return {
      id: makeupBag.id,
      message: 'MakeupBag deleted successfully',
    };
  }
}
