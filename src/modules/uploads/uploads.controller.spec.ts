import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { UploadFolder } from 'src/common/enums/upload-folder.enum';
import { UploadFileDto } from './dto/upload-file.dto';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

describe('UploadsController', () => {
  let controller: UploadsController;
  let service: jest.Mocked<UploadsService>;

  const mockUploadsService = {
    uploadTempImage: jest.fn(),
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

  describe('uploadTempImage', () => {
    it('should upload image from file and return imageId', async () => {
      const dto: UploadFileDto = { folder: UploadFolder.PRODUCTS };
      const mockFile = {
        buffer: Buffer.from('file-data'),
      } as Express.Multer.File;

      service.uploadTempImage.mockResolvedValue('products/image');

      const result = await controller.uploadTempImage(dto, mockFile);

      expect(service.uploadTempImage).toHaveBeenCalledWith(
        dto.folder,
        mockFile,
      );
      expect(result).toEqual({ imageId: 'products/image' });
    });

    it('should propagate service errors', async () => {
      const dto: UploadFileDto = { folder: UploadFolder.PRODUCTS };
      const mockFile = {
        buffer: Buffer.from('file-data'),
      } as Express.Multer.File;

      service.uploadTempImage.mockRejectedValue(new BadRequestException());

      await expect(controller.uploadTempImage(dto, mockFile)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
