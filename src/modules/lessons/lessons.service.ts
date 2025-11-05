import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { ErrorCode } from 'src/common/enums/error-code.enum';
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

  async findAll(): Promise<LessonDocument[]> {
    const lessons = await this.lessonModel
      .find()
      .select('-fullDescription -productIds');

    if (!lessons.length) {
      throw new NotFoundException({ code: ErrorCode.LESSONS_NOT_FOUND });
    }

    return lessons;
  }

  async findAllByAuthor(authorId: Types.ObjectId): Promise<LessonDocument[]> {
    const lessons = await this.lessonModel
      .find({ authorId })
      .select('-fullDescription -productIds');

    if (!lessons.length) {
      throw new NotFoundException({ code: ErrorCode.LESSONS_NOT_FOUND });
    }

    return lessons;
  }

  async findOne(id: Types.ObjectId): Promise<LessonDocument> {
    const lesson = await this.lessonModel
      .findById(id)
      .populate('productIds', 'imageUrl');

    if (!lesson) {
      throw new NotFoundException({ code: ErrorCode.LESSON_NOT_FOUND });
    }

    return lesson;
  }

  async findOneWithClientId(id: Types.ObjectId): Promise<LessonDocument> {
    const lesson = await this.lessonModel.findById(id).select('clientIds');

    if (!lesson) {
      throw new NotFoundException({ code: ErrorCode.LESSON_NOT_FOUND });
    }

    return lesson;
  }

  findByClientId(clientId: Types.ObjectId): Promise<LessonDocument[]> {
    return this.lessonModel.find({ clientIds: clientId }).select('title');
  }

  async findByProductId(productId: Types.ObjectId): Promise<LessonDocument[]> {
    return this.lessonModel.find({ productIds: productId }).select('title');
  }

  async update(
    id: Types.ObjectId,
    dto: UpdateLessonDto,
  ): Promise<LessonDocument> {
    const lesson = await this.lessonModel.findByIdAndUpdate(id, dto, {
      new: true,
      runValidators: true,
    });

    if (!lesson) {
      throw new NotFoundException({ code: ErrorCode.LESSON_NOT_FOUND });
    }

    return lesson;
  }

  updateProducts(
    id: Types.ObjectId,
    dto: UpdateLessonProductsDto,
  ): Promise<LessonDocument> {
    return this.update(id, dto);
  }

  async remove(id: Types.ObjectId): Promise<LessonDocument> {
    const lesson = await this.lessonModel.findByIdAndDelete(id);

    if (!lesson) {
      throw new NotFoundException({ code: ErrorCode.LESSON_NOT_FOUND });
    }

    return lesson;
  }
}
