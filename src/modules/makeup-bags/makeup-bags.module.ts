import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MakeupBagAccessGuard } from './guards/makeup-bag-access.guard';
import { MakeupBagsController } from './makeup-bags.controller';
import { MakeupBagsService } from './makeup-bags.service';
import { MakeupBag, MakeupBagSchema } from './schemas/makeup-bag.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MakeupBag.name, schema: MakeupBagSchema },
    ]),
  ],
  controllers: [MakeupBagsController],
  providers: [MakeupBagsService, MakeupBagAccessGuard],
  exports: [MakeupBagsService],
})
export class MakeupBagsModule {}
