import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { v2 as cloudinary } from 'cloudinary';

import { UploadFolder } from 'src/common/enums/upload-folder.enum';
import { ImageService } from './image.service';

jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      explicit: jest.fn(),
      rename: jest.fn(),
      upload: jest.fn(),
      destroy: jest.fn(),
    },
    url: jest.fn(),
    api: {
      resources: jest.fn(),
      delete_folder: jest.fn(),
    },
  },
}));

describe('ImageService', () => {
  let service: ImageService;

  const mockFolder = UploadFolder.PRODUCTS;
  const mockDisplayName = 'product-id/image';
  const mockTempPublicId = 'products/temp/image';
  const mockPublicId = `products/product-id/image`;

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageService],
    }).compile();

    service = module.get<ImageService>(ImageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadImage', () => {
    it('should skip if publicId does not include /temp/ text', async () => {
      await service.uploadImage('products/image', mockFolder);
      expect(cloudinary.uploader.explicit).not.toHaveBeenCalled();
    });

    it('should move and rename an image', async () => {
      (cloudinary.uploader.explicit as jest.Mock).mockResolvedValue({
        display_name: mockDisplayName,
      });

      (cloudinary.uploader.rename as jest.Mock).mockResolvedValue({
        public_id: mockPublicId,
      });

      await service.uploadImage(mockTempPublicId, mockFolder);

      expect(cloudinary.uploader.explicit).toHaveBeenCalledWith(
        mockTempPublicId,
        expect.any(Object),
      );

      expect(cloudinary.uploader.rename).toHaveBeenCalledWith(
        mockTempPublicId,
        mockPublicId,
        { invalidate: true },
      );
    });

    it('should log error and rethrow on failure', async () => {
      (cloudinary.uploader.explicit as jest.Mock).mockRejectedValue(
        new Error('fail'),
      );

      await expect(
        service.uploadImage(mockTempPublicId, UploadFolder.PRODUCTS),
      ).rejects.toThrow('fail');
    });
  });

  describe('cloneImage', () => {
    it('should clone image into given folder', async () => {
      (cloudinary.url as jest.Mock).mockReturnValue('https://generated-url');
      (cloudinary.uploader.upload as jest.Mock).mockResolvedValue({
        public_id: mockPublicId,
      });

      const result = await service.cloneImage('old/public/id', mockFolder);

      expect(cloudinary.url).toHaveBeenCalledWith('old/public/id', {
        fetch_format: 'auto',
        quality: 'auto',
      });

      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
        'https://generated-url',
        { folder: mockFolder },
      );

      expect(result).toBe(mockPublicId);
    });
  });

  describe('deleteImage', () => {
    it('should call cloudinary destroy', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({});

      await service.deleteImage(mockPublicId);

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(mockPublicId, {
        invalidate: true,
      });
    });

    it('should log error if destroy fails', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockRejectedValue(
        new Error('fail'),
      );
      await service.deleteImage('bad-id');
      expect(Logger.prototype.error).toHaveBeenCalled();
    });
  });

  describe('deleteFolder', () => {
    it('should delete folder when empty', async () => {
      (cloudinary.api.resources as jest.Mock).mockResolvedValue({
        resources: [],
      });

      (cloudinary.api.delete_folder as jest.Mock).mockResolvedValue({});

      await service.deleteFolder('products/123');

      expect(cloudinary.api.resources).toHaveBeenCalledWith({
        type: 'upload',
        prefix: 'products/123/',
        max_results: 1,
      });

      expect(cloudinary.api.delete_folder).toHaveBeenCalledWith('products/123');
    });

    it('should log error if delete folder fails', async () => {
      (cloudinary.api.delete_folder as jest.Mock).mockRejectedValue(
        new Error('fail'),
      );
      await service.deleteFolder('bad-folder');
      expect(Logger.prototype.error).toHaveBeenCalled();
    });

    it('should not delete folder when not empty', async () => {
      (cloudinary.api.resources as jest.Mock).mockResolvedValue({
        resources: [{ public_id: 'some-image' }],
      });

      await service.deleteFolder('products/123');

      expect(cloudinary.api.delete_folder).not.toHaveBeenCalled();
    });
  });
});
