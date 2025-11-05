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
import { ObjectIdParamDto } from 'src/common/dto/object-id-param.dto';
import { Role } from 'src/common/enums/role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CreateMakeupBagDto } from './dto/create-makeup-bag.dto';
import { UpdateMakeupBagDto } from './dto/update-makeup-bag.dto';
import { MakeupBagAccessGuard } from './guards/makeup-bag-access.guard';
import { MakeupBagsService } from './makeup-bags.service';

@Controller('makeup-bags')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MakeupBagsController {
  constructor(private readonly makeupBagsService: MakeupBagsService) {}

  @Post()
  @Roles(Role.MUA)
  async create(@Req() req: Request, @Body() dto: CreateMakeupBagDto) {
    const authorId = req.user!.id;
    const makeupBag = await this.makeupBagsService.create({ ...dto, authorId });
    return { id: makeupBag.id };
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.makeupBagsService.findAll();
  }

  @Get('mine')
  @Roles(Role.MUA)
  findAllByAuthor(@Req() req: Request) {
    const authorId = req.user!.id;
    return this.makeupBagsService.findAllByAuthor(authorId);
  }

  @Get(':id')
  @UseGuards(MakeupBagAccessGuard)
  findOne(@Param() params: ObjectIdParamDto) {
    return this.makeupBagsService.findOne(params.id);
  }

  @Put(':id')
  @Roles(Role.MUA)
  async update(
    @Param() params: ObjectIdParamDto,
    @Body() dto: UpdateMakeupBagDto,
  ) {
    const makeupBag = await this.makeupBagsService.update(params.id, dto);
    return { id: makeupBag.id };
  }

  @Delete(':id')
  @Roles(Role.MUA)
  async remove(@Param() params: ObjectIdParamDto) {
    const makeupBag = await this.makeupBagsService.remove(params.id);
    return { id: makeupBag.id };
  }
}
