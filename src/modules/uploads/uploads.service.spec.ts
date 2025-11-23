import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { UploadFolder } from 'src/common/enums/upload-folder.enum';
import { getCloudinaryMocks } from 'test/mocks/cloudinary.mock';
import { ImageService } from '../shared/image.service';
import { UploadsService } from './uploads.service';

jest.mock('cloudinary', () =>
  require('test/mocks/cloudinary.mock').mockCloudinary(),
);

describe('UploadsService', () => {
  let service: UploadsService;
  let mockConfigService: jest.Mocked<ConfigService>;
  let cloudinaryMocks: ReturnType<typeof getCloudinaryMocks>;

  const mockImageService = {
    cloneImage: jest.fn().mockResolvedValue('mocked-image-id'),
    uploadImage: jest.fn().mockResolvedValue('mocked-image-id'),
    deleteImage: jest.fn().mockResolvedValue(undefined),
    deleteFolder: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    cloudinaryMocks = getCloudinaryMocks();

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
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: ImageService,
          useValue: mockImageService,
        },
      ],
    }).compile();

    service = module.get<UploadsService>(UploadsService);
  });

  describe('uploadTempImage', () => {
    it('should throw BadRequestException if no file is provided', async () => {
      await expect(
        service.uploadTempImage(UploadFolder.PRODUCTS, undefined),
      ).rejects.toThrow(BadRequestException);
    });

    it('should upload file and store temp upload', async () => {
      const mockFile = {
        buffer: Buffer.from('test-data'),
        mimetype: 'image/png',
      } as Express.Multer.File;

      cloudinaryMocks.upload.mockResolvedValue({
        secure_url: 'https://cloudinary.com/test.png',
        public_id: 'public-id',
      });

      const result = await service.uploadTempImage(
        UploadFolder.PRODUCTS,
        mockFile,
      );

      expect(cloudinaryMocks.upload).toHaveBeenCalledWith(
        expect.stringMatching(/^data:image\/png;base64,/),
        expect.objectContaining({
          folder: 'products/temp',
          resource_type: 'auto',
        }),
      );

      expect(result).toBe('public-id');
    });

    it('should throw BadRequestException on Cloudinary error', async () => {
      const mockFile = {
        buffer: Buffer.from('test-data'),
        mimetype: 'image/png',
      } as Express.Multer.File;

      cloudinaryMocks.upload.mockRejectedValue(new Error('Cloudinary failed'));

      await expect(
        service.uploadTempImage(UploadFolder.PRODUCTS, mockFile),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
