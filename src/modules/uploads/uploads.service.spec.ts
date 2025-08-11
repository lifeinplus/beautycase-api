import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { TempUploadsService } from '../shared/temp-uploads.service';
import { UploadsService } from './uploads.service';

describe('UploadsService', () => {
  let service: UploadsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        { provide: TempUploadsService, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<UploadsService>(UploadsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
