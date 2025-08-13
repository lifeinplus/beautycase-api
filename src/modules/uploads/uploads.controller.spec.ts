import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UploadFolder } from 'src/common/enums/upload-folder.enum';
import { UploadFileDto } from './dto/upload-file.dto';
import { UploadUrlDto } from './dto/upload-url.dto';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

describe('UploadsController', () => {
  let controller: UploadsController;
  let service: jest.Mocked<UploadsService>;

  const mockUploadsService = {
    uploadTempImageByFile: jest.fn(),
    uploadTempImageByUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadsController],
      providers: [
        {
          provide: UploadsService,
          useValue: mockUploadsService,
        },
      ],
    }).compile();

    controller = module.get<UploadsController>(UploadsController);
    service = module.get(UploadsService) as jest.Mocked<UploadsService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadTempImageByFile', () => {
    it('should upload image from file and return imageUrl', async () => {
      const dto: UploadFileDto = { folder: UploadFolder.PRODUCTS };
      const mockFile = {
        buffer: Buffer.from('file-data'),
      } as Express.Multer.File;

      service.uploadTempImageByFile.mockResolvedValue(
        'https://cloudinary.com/image.png',
      );

      const result = await controller.uploadTempImageByFile(dto, mockFile);

      expect(service.uploadTempImageByFile).toHaveBeenCalledWith(
        dto.folder,
        mockFile,
      );
      expect(result).toEqual({ imageUrl: 'https://cloudinary.com/image.png' });
    });

    it('should propagate service errors', async () => {
      const dto: UploadFileDto = { folder: UploadFolder.PRODUCTS };
      const mockFile = {
        buffer: Buffer.from('file-data'),
      } as Express.Multer.File;

      service.uploadTempImageByFile.mockRejectedValue(
        new BadRequestException(),
      );

      await expect(
        controller.uploadTempImageByFile(dto, mockFile),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('uploadTempImageByUrl', () => {
    it('should upload image from URL and return imageUrl', async () => {
      const dto: UploadUrlDto = {
        folder: UploadFolder.STAGES,
        imageUrl: 'https://example.com/image.jpg',
      };

      service.uploadTempImageByUrl.mockResolvedValue(
        'https://cloudinary.com/from-url.jpg',
      );

      const result = await controller.uploadTempImageByUrl(dto);

      expect(service.uploadTempImageByUrl).toHaveBeenCalledWith(
        dto.folder,
        dto.imageUrl,
      );
      expect(result).toEqual({
        imageUrl: 'https://cloudinary.com/from-url.jpg',
      });
    });

    it('should propagate service errors', async () => {
      const dto: UploadUrlDto = {
        folder: UploadFolder.STAGES,
        imageUrl: 'https://example.com/image.jpg',
      };

      service.uploadTempImageByUrl.mockRejectedValue(new BadRequestException());

      await expect(controller.uploadTempImageByUrl(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
