import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { ImageService } from '../shared/image.service';
import { Tool } from './schemas/tool.schema';
import { ToolsService } from './tools.service';

describe('ToolsService', () => {
  let service: ToolsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToolsService,
        { provide: getModelToken(Tool.name), useValue: {} },
        { provide: ImageService, useValue: {} },
      ],
    }).compile();

    service = module.get<ToolsService>(ToolsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
