import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import type { UserRequest } from 'src/common/types/user-request.interface';
import { MakeupBag, MakeupBagDocument } from '../schemas/makeup-bag.schema';

@Injectable()
export class MakeupBagAccessGuard implements CanActivate {
  constructor(
    @InjectModel(MakeupBag.name)
    private makeupBagModel: Model<MakeupBagDocument>,
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
      const makeupBag = await this.makeupBagModel
        .findById(id)
        .select('clientId');

      if (!makeupBag || !userId || makeupBag.clientId.toString() !== userId) {
        throw new NotFoundException('MakeupBag not found');
      }
    }

    return true;
  }
}
