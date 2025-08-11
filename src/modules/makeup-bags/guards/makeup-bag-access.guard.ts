import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { UserRequest } from 'src/common/types/user-request.interface';
import { MakeupBagsService } from '../makeup-bags.service';

@Injectable()
export class MakeupBagAccessGuard implements CanActivate {
  constructor(private readonly makeupBagsService: MakeupBagsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: UserRequest = context.switchToHttp().getRequest();
    const { user, params } = request;
    const { id } = params;
    const { role, userId } = user || {};

    if (['admin', 'mua'].includes(role || '')) {
      return true;
    }

    if (role === 'client') {
      const makeupBag = await this.makeupBagsService.findOneWithClientId(id);

      if (!makeupBag || !userId || makeupBag.clientId.toString() !== userId) {
        throw new NotFoundException('MakeupBag not found');
      }
    }

    return true;
  }
}
