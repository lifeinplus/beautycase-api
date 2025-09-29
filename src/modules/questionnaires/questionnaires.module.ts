import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SharedModule } from '../shared/shared.module';
import { QuestionnairesController } from './questionnaires.controller';
import { QuestionnairesService } from './questionnaires.service';
import {
  Questionnaire,
  QuestionnaireSchema,
} from './schemas/questionnaire.schema';
import { Training, TrainingSchema } from './schemas/training.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Questionnaire.name, schema: QuestionnaireSchema },
      { name: Training.name, schema: TrainingSchema },
    ]),
    SharedModule,
  ],
  controllers: [QuestionnairesController],
  providers: [QuestionnairesService],
  exports: [QuestionnairesService],
})
export class QuestionnairesModule {}
