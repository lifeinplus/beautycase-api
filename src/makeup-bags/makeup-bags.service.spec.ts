import { Test, TestingModule } from '@nestjs/testing';
import { MakeupBagsService } from './makeup-bags.service';

describe('MakeupBagsService', () => {
  let service: MakeupBagsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MakeupBagsService],
    }).compile();

    service = module.get<MakeupBagsService>(MakeupBagsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
