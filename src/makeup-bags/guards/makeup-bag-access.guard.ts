import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { MakeupBagsService } from '../makeup-bags.service';

@Injectable()
export class MakeupBagAccessGuard implements CanActivate {
  constructor(private readonly makeupBagsService: MakeupBagsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { id } = request.params;
    const user = request.user;

    if (!user) {
      return false;
    }

    const { role, userId } = user;

    if (['admin', 'mua'].includes(role)) {
      return true;
    }

    // Client can only access their own makeup bags
    // if (role === 'client') {
    //   const makeupBag = await this.makeupBagModel
    //     .findById(id)
    //     .select('clientId')
    //     .exec();

    //   if (!makeupBag || !userId || makeupBag.clientId.toString() !== userId) {
    //     throw new NotFoundException('MakeupBag not found');
    //   }

    //   return true;
    // }

    const makeupBag = await this.makeupBagsService.getById(id);
    return makeupBag?.clientId?.toString() === user.userId;
  }
}
