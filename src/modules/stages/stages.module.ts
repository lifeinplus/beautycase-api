import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SharedModule } from '../shared/shared.module';
import { Stage, StageSchema } from './schemas/stage.schema';
import { StagesController } from './stages.controller';
import { StagesService } from './stages.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Stage.name, schema: StageSchema }]),
    SharedModule,
  ],
  controllers: [StagesController],
  providers: [StagesService],
  exports: [StagesService],
})
export class StagesModule {}
