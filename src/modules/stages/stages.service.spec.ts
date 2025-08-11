import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { ImageService } from '../shared/image.service';
import { Stage } from './schemas/stage.schema';
import { StagesService } from './stages.service';

describe('StagesService', () => {
  let service: StagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StagesService,
        { provide: getModelToken(Stage.name), useValue: {} },
        { provide: ImageService, useValue: {} },
      ],
    }).compile();

    service = module.get<StagesService>(StagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
