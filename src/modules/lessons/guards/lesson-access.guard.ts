import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Types } from 'mongoose';
import type { UserRequest } from 'src/common/types/user-request.interface';
import { LessonsService } from '../lessons.service';

@Injectable()
export class LessonAccessGuard implements CanActivate {
  constructor(private readonly lessonsService: LessonsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: UserRequest = context.switchToHttp().getRequest();
    const { user, params } = request;
    const { id } = params;
    const { role, userId } = user || {};

    if (['admin', 'mua'].includes(role || '')) {
      return true;
    }

    if (role === 'client') {
      const lesson = await this.lessonsService.findOneWithClientId(
        new Types.ObjectId(id),
      );

      if (
        !lesson ||
        !userId ||
        !lesson.clientIds?.some((id) => id.toString() === userId)
      ) {
        throw new NotFoundException({ code: 'LESSONS_NOT_FOUND' });
      }
    }

    return true;
  }
}
