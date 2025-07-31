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

import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
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
  async create(@Body() createLessonDto: CreateLessonDto) {
    const lesson = await this.lessonsService.create(createLessonDto);

    return {
      id: lesson.id,
      message: 'Lesson created successfully',
    };
  }

  @Get()
  async getAll() {
    return await this.lessonsService.getAll();
  }

  @Get(':id')
  @UseGuards(LessonAccessGuard)
  async getById(@Param() params: LessonParamsDto) {
    return await this.lessonsService.getById(params.id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'mua')
  async update(
    @Param() params: LessonParamsDto,
    @Body() updateLessonDto: UpdateLessonDto,
  ) {
    const lesson = await this.lessonsService.updateById(
      params.id,
      updateLessonDto,
    );

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
    @Body() updateLessonProductsDto: UpdateLessonProductsDto,
  ) {
    const lesson = await this.lessonsService.updateProducts(
      params.id,
      updateLessonProductsDto,
    );

    return {
      id: lesson.id,
      message: 'Lesson products updated successfully',
    };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'mua')
  async deleteById(@Param() params: LessonParamsDto) {
    const lesson = await this.lessonsService.deleteById(params.id);

    return {
      id: lesson.id,
      message: 'Lesson deleted successfully',
    };
  }
}
