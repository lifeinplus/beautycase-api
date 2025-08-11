import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { ImageService } from '../shared/image.service';
import { QuestionnairesService } from './questionnaires.service';
import { Questionnaire } from './schemas/questionnaire.schema';

describe('QuestionnairesService', () => {
  let service: QuestionnairesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionnairesService,
        { provide: getModelToken(Questionnaire.name), useValue: {} },
        { provide: ImageService, useValue: {} },
      ],
    }).compile();

    service = module.get<QuestionnairesService>(QuestionnairesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
