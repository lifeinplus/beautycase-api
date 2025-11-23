import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { UploadFolder } from 'src/common/enums/upload-folder.enum';
import { getCloudinaryMocks } from 'test/mocks/cloudinary.mock';
import { ImageService } from './image.service';

jest.mock('cloudinary', () =>
  require('test/mocks/cloudinary.mock').mockCloudinary(),
);

describe('ImageService', () => {
  let service: ImageService;
  let cloudinaryMocks: ReturnType<typeof getCloudinaryMocks>;

  const mockFolder = UploadFolder.PRODUCTS;
  const mockDisplayName = 'product-id/image';
  const mockTempPublicId = 'products/temp/image';
  const mockPublicId = `products/product-id/image`;

  beforeEach(async () => {
    cloudinaryMocks = getCloudinaryMocks();
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
      expect(cloudinaryMocks.explicit).not.toHaveBeenCalled();
    });

    it('should move and rename an image', async () => {
      cloudinaryMocks.explicit.mockResolvedValue({
        display_name: mockDisplayName,
      });

      cloudinaryMocks.rename.mockResolvedValue({
        public_id: mockPublicId,
      });

      await service.uploadImage(mockTempPublicId, mockFolder);

      expect(cloudinaryMocks.explicit).toHaveBeenCalledWith(
        mockTempPublicId,
        expect.any(Object),
      );

      expect(cloudinaryMocks.rename).toHaveBeenCalledWith(
        mockTempPublicId,
        mockPublicId,
        { invalidate: true },
      );
    });

    it('should log error and rethrow on failure', async () => {
      cloudinaryMocks.explicit.mockRejectedValue(new Error('fail'));

      await expect(
        service.uploadImage(mockTempPublicId, UploadFolder.PRODUCTS),
      ).rejects.toThrow('fail');
    });
  });

  describe('cloneImage', () => {
    it('should clone image into given folder', async () => {
      cloudinaryMocks.url.mockReturnValue('https://generated-url');
      cloudinaryMocks.upload.mockResolvedValue({
        public_id: mockPublicId,
      });

      const result = await service.cloneImage('old/public/id', mockFolder);

      expect(cloudinaryMocks.url).toHaveBeenCalledWith('old/public/id', {
        fetch_format: 'auto',
        quality: 'auto',
      });

      expect(cloudinaryMocks.upload).toHaveBeenCalledWith(
        'https://generated-url',
        { folder: mockFolder },
      );

      expect(result).toBe(mockPublicId);
    });
  });

  describe('deleteImage', () => {
    it('should call cloudinary destroy', async () => {
      cloudinaryMocks.destroy.mockResolvedValue({});

      await service.deleteImage(mockPublicId);

      expect(cloudinaryMocks.destroy).toHaveBeenCalledWith(mockPublicId, {
        invalidate: true,
      });
    });

    it('should log error if destroy fails', async () => {
      cloudinaryMocks.destroy.mockRejectedValue(new Error('fail'));
      await service.deleteImage('bad-id');
      expect(Logger.prototype.error).toHaveBeenCalled();
    });
  });

  describe('deleteFolder', () => {
    it('should delete folder when empty', async () => {
      cloudinaryMocks.resources.mockResolvedValue({
        resources: [],
      });

      cloudinaryMocks.deleteFolder.mockResolvedValue({});

      await service.deleteFolder('products/123');

      expect(cloudinaryMocks.resources).toHaveBeenCalledWith({
        type: 'upload',
        prefix: 'products/123/',
        max_results: 1,
      });

      expect(cloudinaryMocks.deleteFolder).toHaveBeenCalledWith('products/123');
    });

    it('should log error if delete folder fails', async () => {
      cloudinaryMocks.deleteFolder.mockRejectedValue(new Error('fail'));
      await service.deleteFolder('bad-folder');
      expect(Logger.prototype.error).toHaveBeenCalled();
    });

    it('should not delete folder when not empty', async () => {
      cloudinaryMocks.resources.mockResolvedValue({
        resources: [{ public_id: 'some-image' }],
      });

      await service.deleteFolder('products/123');

      expect(cloudinaryMocks.deleteFolder).not.toHaveBeenCalled();
    });
  });
});
