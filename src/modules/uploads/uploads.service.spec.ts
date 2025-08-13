import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { v2 as cloudinary } from 'cloudinary';

import { UploadFolder } from 'src/common/enums/upload-folder.enum';
import { TempUploadsService } from '../shared/temp-uploads.service';
import { UploadsService } from './uploads.service';

jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload: jest.fn(),
    },
    config: jest.fn(),
  },
}));

describe('UploadsService', () => {
  let service: UploadsService;
  let mockTempUploadsService: jest.Mocked<TempUploadsService>;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    mockTempUploadsService = {
      store: jest.fn(),
    } as any;

    mockConfigService = {
      get: jest.fn((key: string) => {
        const envMap: Record<string, string> = {
          CLOUDINARY_CLOUD_NAME: 'test-cloud',
          CLOUDINARY_API_KEY: 'test-key',
          CLOUDINARY_API_SECRET: 'test-secret',
        };
        return envMap[key];
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        {
          provide: TempUploadsService,
          useValue: mockTempUploadsService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<UploadsService>(UploadsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadTempImageByFile', () => {
    it('should throw BadRequestException if no file is provided', async () => {
      await expect(
        service.uploadTempImageByFile(UploadFolder.PRODUCTS, undefined),
      ).rejects.toThrow(BadRequestException);
    });

    it('should upload file and store temp upload', async () => {
      const mockFile = {
        buffer: Buffer.from('test-data'),
        mimetype: 'image/png',
      } as Express.Multer.File;

      (cloudinary.uploader.upload as jest.Mock).mockResolvedValue({
        secure_url: 'https://cloudinary.com/test.png',
        public_id: 'public-id',
      });

      const result = await service.uploadTempImageByFile(
        UploadFolder.PRODUCTS,
        mockFile,
      );

      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
        expect.stringMatching(/^data:image\/png;base64,/),
        expect.objectContaining({
          folder: 'products/temp',
          resource_type: 'auto',
        }),
      );
      expect(mockTempUploadsService.store).toHaveBeenCalledWith(
        'https://cloudinary.com/test.png',
        'public-id',
      );
      expect(result).toBe('https://cloudinary.com/test.png');
    });

    it('should throw BadRequestException on Cloudinary error', async () => {
      const mockFile = {
        buffer: Buffer.from('test-data'),
        mimetype: 'image/png',
      } as Express.Multer.File;

      (cloudinary.uploader.upload as jest.Mock).mockRejectedValue(
        new Error('Cloudinary failed'),
      );

      await expect(
        service.uploadTempImageByFile(UploadFolder.PRODUCTS, mockFile),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('uploadTempImageByUrl', () => {
    it('should upload image from URL and store temp upload', async () => {
      (cloudinary.uploader.upload as jest.Mock).mockResolvedValue({
        secure_url: 'https://cloudinary.com/from-url.jpg',
        public_id: 'public-id-url',
      });

      const result = await service.uploadTempImageByUrl(
        UploadFolder.STAGES,
        'https://example.com/image.jpg',
      );

      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
        'https://example.com/image.jpg',
        expect.objectContaining({
          folder: 'stages/temp',
          format: 'jpg',
        }),
      );
      expect(mockTempUploadsService.store).toHaveBeenCalledWith(
        'https://cloudinary.com/from-url.jpg',
        'public-id-url',
      );
      expect(result).toBe('https://cloudinary.com/from-url.jpg');
    });

    it('should throw BadRequestException on Cloudinary error', async () => {
      (cloudinary.uploader.upload as jest.Mock).mockRejectedValue(
        new Error('Upload failed'),
      );

      await expect(
        service.uploadTempImageByUrl(
          UploadFolder.STAGES,
          'https://example.com/image.jpg',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
