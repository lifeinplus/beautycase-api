import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SharedModule } from '../shared/shared.module';
import { QuestionnairesController } from './questionnaires.controller';
import { QuestionnairesService } from './questionnaires.service';
import {
  MakeupBagQuestionnaire,
  MakeupBagQuestionnaireSchema,
} from './schemas/makeup-bag-questionnaire.schema';
import {
  TrainingQuestionnaire,
  TrainingQuestionnaireSchema,
} from './schemas/training-questionnaire.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: MakeupBagQuestionnaire.name,
        schema: MakeupBagQuestionnaireSchema,
      },
      { name: TrainingQuestionnaire.name, schema: TrainingQuestionnaireSchema },
    ]),
    SharedModule,
  ],
  controllers: [QuestionnairesController],
  providers: [QuestionnairesService],
  exports: [QuestionnairesService],
})
export class QuestionnairesModule {}
