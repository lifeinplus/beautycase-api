import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { Observable } from 'rxjs';

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
    const request = context.switchToHttp().getRequest();
    const productId = Types.ObjectId.createFromHexString(request.params.id);

    if (productId) {
      const [lessons, stages] = await Promise.all([
        this.lessonsService.findByProductId(productId),
        this.stagesService.findByProductId(productId),
      ]);

      if (stages.length > 0 || lessons.length > 0) {
        const lessonTitles = lessons.map((l) => l.title).join(', ');
        const stageTitles = stages.map((s) => s.title).join(', ');

        throw new BadRequestException(
          `Cannot delete product. It is currently used in: 
          ${lessonTitles ? 'Lessons: ' + lessonTitles : ''}
          ${stageTitles ? 'Stages: ' + stageTitles : ''}`,
        );
      }
    }

    return next.handle();
  }
}
