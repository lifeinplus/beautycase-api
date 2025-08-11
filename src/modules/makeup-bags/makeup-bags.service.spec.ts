import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { MakeupBagsService } from './makeup-bags.service';
import { MakeupBag } from './schemas/makeup-bag.schema';

describe('MakeupBagsService', () => {
  let service: MakeupBagsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MakeupBagsService,
        { provide: getModelToken(MakeupBag.name), useValue: {} },
      ],
    }).compile();

    service = module.get<MakeupBagsService>(MakeupBagsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
