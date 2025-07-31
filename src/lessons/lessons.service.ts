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

  async create(createLessonDto: CreateLessonDto): Promise<LessonDocument> {
    return await this.lessonModel.create(createLessonDto);
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

  async getByClientId(clientId: string): Promise<LessonDocument[]> {
    return await this.lessonModel.find({ clientIds: clientId }).select('title');
  }

  async updateById(
    id: string,
    updateLessonDto: UpdateLessonDto,
  ): Promise<LessonDocument> {
    const lesson = await this.lessonModel.findByIdAndUpdate(
      id,
      updateLessonDto,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return lesson;
  }

  async updateProducts(
    id: string,
    updateLessonProductsDto: UpdateLessonProductsDto,
  ): Promise<LessonDocument> {
    return await this.updateById(id, updateLessonProductsDto);
  }

  async deleteById(id: string): Promise<LessonDocument> {
    const lesson = await this.lessonModel.findByIdAndDelete(id);

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return lesson;
  }
}
