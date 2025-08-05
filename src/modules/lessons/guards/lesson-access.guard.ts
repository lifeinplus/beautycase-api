import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Lesson, LessonDocument } from '../schemas/lesson.schema';

interface UserRequest {
  user?: {
    role?: string;
    userId?: string;
  };
  params: {
    id: string;
  };
}

@Injectable()
export class LessonAccessGuard implements CanActivate {
  constructor(
    @InjectModel(Lesson.name) private lessonModel: Model<LessonDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: UserRequest = context.switchToHttp().getRequest();
    const { user, params } = request;
    const { id } = params;
    const { role, userId } = user || {};

    if (['admin', 'mua'].includes(role || '')) {
      return true;
    }

    if (role === 'client') {
      const lesson = await this.lessonModel.findById(id).select('clientIds');

      if (
        !lesson ||
        !userId ||
        !lesson.clientIds?.some((id) => id.toString() === userId)
      ) {
        throw new NotFoundException('Lesson not found');
      }
    }

    return true;
  }
}
