import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonProductsDto } from './dto/update-lesson-products.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { Lesson, LessonDocument } from './schemas/lesson.schema';

@Injectable()
export class LessonsService {
  constructor(
    @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>,
  ) {}

  create(dto: CreateLessonDto): Promise<LessonDocument> {
    return this.lessonModel.create(dto);
  }

  async getAll(): Promise<LessonDocument[]> {
    const lessons = await this.lessonModel
      .find()
      .select('-fullDescription -productIds');

    if (!lessons.length) {
      throw new NotFoundException('Lessons not found');
    }

    return lessons;
  }

  async getById(id: string): Promise<LessonDocument> {
    const lesson = await this.lessonModel
      .findById(id)
      .populate('productIds', 'imageUrl');

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return lesson;
  }

  getByClientId(clientId: string): Promise<LessonDocument[]> {
    return this.lessonModel.find({ clientIds: clientId }).select('title');
  }

  async updateById(id: string, dto: UpdateLessonDto): Promise<LessonDocument> {
    const lesson = await this.lessonModel.findByIdAndUpdate(id, dto, {
      new: true,
      runValidators: true,
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return lesson;
  }

  updateProducts(
    id: string,
    dto: UpdateLessonProductsDto,
  ): Promise<LessonDocument> {
    return this.updateById(id, dto);
  }

  async deleteById(id: string): Promise<LessonDocument> {
    const lesson = await this.lessonModel.findByIdAndDelete(id);

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return lesson;
  }
}
