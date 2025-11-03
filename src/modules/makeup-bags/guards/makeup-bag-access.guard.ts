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
import { MakeupBagsService } from '../makeup-bags.service';

@Injectable()
export class MakeupBagAccessGuard implements CanActivate {
  constructor(private readonly makeupBagsService: MakeupBagsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    if (req.user!.role && [Role.ADMIN, Role.MUA].includes(req.user!.role)) {
      return true;
    }

    if (req.user!.role === Role.CLIENT) {
      const makeupBag = await this.makeupBagsService.findOneWithClientId(
        new Types.ObjectId(req.params.id),
      );

      if (!makeupBag || !req.user!.id || makeupBag.clientId !== req.user!.id) {
        throw new NotFoundException({ code: ErrorCode.MAKEUP_BAG_NOT_FOUND });
      }
    }

    return true;
  }
}
