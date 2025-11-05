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
import { MakeupBagsService } from 'src/modules/makeup-bags/makeup-bags.service';

@Injectable()
export class ToolDeletionInterceptor implements NestInterceptor {
  constructor(private readonly makeupBagsService: MakeupBagsService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const { id } = request.params;

    if (!isValidObjectId(id)) {
      throw new BadRequestException({ code: ErrorCode.INVALID_OBJECT_ID });
    }

    const toolId = Types.ObjectId.createFromHexString(id);

    if (toolId) {
      const [makeupBags] = await Promise.all([
        this.makeupBagsService.findByToolId(toolId),
      ]);

      if (makeupBags.length > 0) {
        throw new BadRequestException({
          code: ErrorCode.TOOL_IN_USE,
          details: {
            makeupBags: makeupBags.map((b) => ({
              id: b.id,
              name: (b.categoryId as any).name,
            })),
          },
        });
      }
    }

    return next.handle();
  }
}
