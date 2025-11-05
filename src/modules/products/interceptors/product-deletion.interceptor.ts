import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { isValidObjectId, Types } from 'mongoose';
import { Observable } from 'rxjs';

import { ErrorCode } from 'src/common/enums/error-code.enum';
import { LessonsService } from 'src/modules/lessons/lessons.service';
import { StagesService } from 'src/modules/stages/stages.service';

@Injectable()
export class ProductDeletionInterceptor implements NestInterceptor {
  constructor(
    private readonly lessonsService: LessonsService,
    private readonly stagesService: StagesService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const { id } = request.params;

    if (!isValidObjectId(id)) {
      throw new BadRequestException({ code: ErrorCode.INVALID_OBJECT_ID });
    }

    const productId = Types.ObjectId.createFromHexString(id);

    if (productId) {
      const [lessons, stages] = await Promise.all([
        this.lessonsService.findByProductId(productId),
        this.stagesService.findByProductId(productId),
      ]);

      if (stages.length > 0 || lessons.length > 0) {
        throw new BadRequestException({
          code: ErrorCode.PRODUCT_IN_USE,
          details: {
            lessons: lessons.map((l) => ({ id: l.id, title: l.title })),
            stages: stages.map((s) => ({ id: s.id, title: s.title })),
          },
        });
      }
    }

    return next.handle();
  }
}
