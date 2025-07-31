import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { LessonAccessGuard } from './guards/lesson-access.guard';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { Lesson, LessonSchema } from './schemas/lesson.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Lesson.name, schema: LessonSchema }]),
  ],
  controllers: [LessonsController],
  providers: [LessonsService, LessonAccessGuard],
  exports: [LessonsService],
})
export class LessonsModule {}
