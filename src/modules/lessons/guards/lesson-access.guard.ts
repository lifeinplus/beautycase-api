import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { Types } from 'mongoose';

import { ErrorCode } from 'src/common/enums/error-code.enum';
import { Role } from 'src/common/enums/role.enum';
import { LessonsService } from '../lessons.service';

@Injectable()
export class LessonAccessGuard implements CanActivate {
  constructor(private readonly lessonsService: LessonsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    if (req.user!.role && [Role.ADMIN, Role.MUA].includes(req.user!.role)) {
      return true;
    }

    if (req.user!.role === Role.CLIENT) {
      const lesson = await this.lessonsService.findOneWithClientId(
        new Types.ObjectId(req.params.id),
      );

      if (
        !lesson ||
        !req.user!.id ||
        !lesson.clientIds?.some((id) => id.equals(req.user!.id))
      ) {
        throw new NotFoundException({ code: ErrorCode.LESSONS_NOT_FOUND });
      }
    }

    return true;
  }
}
