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
} from '@nestjs/common';
import { Request } from 'express';

import { Roles } from 'src/common/decorators/roles.decorator';
import { MongoIdParamDto } from 'src/common/dto/mongo-id-param.dto';
import { Role } from 'src/common/enums/role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonProductsDto } from './dto/update-lesson-products.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { LessonAccessGuard } from './guards/lesson-access.guard';
import { LessonsService } from './lessons.service';

@Controller('lessons')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @Roles(Role.MUA)
  async create(@Req() req: Request, @Body() dto: CreateLessonDto) {
    const authorId = req.user!.id;
    const lesson = await this.lessonsService.create({ ...dto, authorId });
    return { id: lesson.id };
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.lessonsService.findAll();
  }

  @Get('mine')
  @Roles(Role.MUA)
  findAllByAuthor(@Req() req: Request) {
    const authorId = req.user!.id;
    return this.lessonsService.findAllByAuthor(authorId);
  }

  @Get(':id')
  @UseGuards(LessonAccessGuard)
  findOne(@Param() params: MongoIdParamDto) {
    return this.lessonsService.findOne(params.id);
  }

  @Put(':id')
  @Roles(Role.MUA)
  async update(@Param() params: MongoIdParamDto, @Body() dto: UpdateLessonDto) {
    const lesson = await this.lessonsService.update(params.id, dto);
    return { id: lesson.id };
  }

  @Patch(':id/products')
  @Roles(Role.MUA)
  async updateProducts(
    @Param() params: MongoIdParamDto,
    @Body() dto: UpdateLessonProductsDto,
  ) {
    const lesson = await this.lessonsService.updateProducts(params.id, dto);
    return { id: lesson.id };
  }

  @Delete(':id')
  @Roles(Role.MUA)
  async remove(@Param() params: MongoIdParamDto) {
    const lesson = await this.lessonsService.remove(params.id);
    return { id: lesson.id };
  }
}
