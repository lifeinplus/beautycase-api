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
import { CreateLessonDto } from './dto/create-lesson.dto';
import { LessonParamsDto } from './dto/lesson-params.dto';
import { UpdateLessonProductsDto } from './dto/update-lesson-products.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { LessonAccessGuard } from './guards/lesson-access.guard';
import { LessonsService } from './lessons.service';

@Controller('lessons')
@UseGuards(JwtAuthGuard)
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'mua')
  async create(@Body() dto: CreateLessonDto) {
    const lesson = await this.lessonsService.create(dto);

    return {
      id: lesson.id,
      message: 'Lesson created successfully',
    };
  }

  @Get()
  findAll() {
    return this.lessonsService.findAll();
  }

  @Get(':id')
  @UseGuards(LessonAccessGuard)
  findOne(@Param() params: LessonParamsDto) {
    return this.lessonsService.findOne(params.id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'mua')
  async update(@Param() params: LessonParamsDto, @Body() dto: UpdateLessonDto) {
    const lesson = await this.lessonsService.update(params.id, dto);

    return {
      id: lesson.id,
      message: 'Lesson updated successfully',
    };
  }

  @Patch(':id/products')
  @UseGuards(RolesGuard)
  @Roles('admin', 'mua')
  async updateProducts(
    @Param() params: LessonParamsDto,
    @Body() dto: UpdateLessonProductsDto,
  ) {
    const lesson = await this.lessonsService.updateProducts(params.id, dto);

    return {
      id: lesson.id,
      message: 'Lesson products updated successfully',
    };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'mua')
  async remove(@Param() params: LessonParamsDto) {
    const lesson = await this.lessonsService.remove(params.id);

    return {
      id: lesson.id,
      message: 'Lesson deleted successfully',
    };
  }
}
