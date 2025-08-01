import { Test, TestingModule } from '@nestjs/testing';
import { MakeupBagsController } from './makeup-bags.controller';

describe('MakeupBagsController', () => {
  let controller: MakeupBagsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MakeupBagsController],
    }).compile();

    controller = module.get<MakeupBagsController>(MakeupBagsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
