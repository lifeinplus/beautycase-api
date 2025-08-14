import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { v2 as cloudinary } from 'cloudinary';

import { UploadFolder } from 'src/common/enums/upload-folder.enum';
import { ImageDocument, ImageService } from './image.service';
import { TempUploadsService } from './temp-uploads.service';

jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      explicit: jest.fn(),
      rename: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

describe('ImageService', () => {
  let service: ImageService;
  let tempUploadsService: jest.Mocked<TempUploadsService>;

  const mockDoc: ImageDocument = {
    _id: 'doc-id',
    imageUrl: 'https://old.com/img.jpg',
    imageId: 'old-id',
  };

  beforeEach(async () => {
    tempUploadsService = {
      get: jest.fn(),
      remove: jest.fn(),
    } as any;

    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageService,
        {
          provide: TempUploadsService,
          useValue: tempUploadsService,
        },
      ],
    }).compile();

    service = module.get<ImageService>(ImageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleImageUpload', () => {
    it('should skip if publicId not found', async () => {
      tempUploadsService.get.mockReturnValue(undefined);

      await service.handleImageUpload(
        { ...mockDoc },
        {
          folder: UploadFolder.PRODUCTS,
          secureUrl: 'https://temp.com/image.png',
        },
      );

      expect(cloudinary.uploader.explicit).not.toHaveBeenCalled();
    });

    it('should rename and update doc image', async () => {
      tempUploadsService.get.mockReturnValue('temp-id');
      (cloudinary.uploader.explicit as jest.Mock).mockResolvedValue({});
      (cloudinary.uploader.rename as jest.Mock).mockResolvedValue({
        public_id: 'new-id',
        secure_url: 'https://cdn.com/new.png',
      });

      const doc = { ...mockDoc };
      await service.handleImageUpload(doc, {
        folder: UploadFolder.PRODUCTS,
        secureUrl: 'https://temp.com/image.png',
      });

      expect(cloudinary.uploader.explicit).toHaveBeenCalledWith(
        'temp-id',
        expect.any(Object),
      );
      expect(cloudinary.uploader.rename).toHaveBeenCalledWith(
        'temp-id',
        expect.stringMatching(/^products\/doc-id$/),
        { invalidate: true },
      );
      expect(doc.imageId).toBe('new-id');
      expect(doc.imageUrl).toBe('https://cdn.com/new.png');
      expect(tempUploadsService.remove).toHaveBeenCalledWith(
        'https://temp.com/image.png',
      );
    });

    it('should log error and rethrow on failure', async () => {
      tempUploadsService.get.mockReturnValue('temp-id');
      (cloudinary.uploader.explicit as jest.Mock).mockRejectedValue(
        new Error('fail'),
      );

      await expect(
        service.handleImageUpload(
          { ...mockDoc },
          {
            folder: UploadFolder.PRODUCTS,
            secureUrl: 'https://temp.com/image.png',
          },
        ),
      ).rejects.toThrow('fail');
    });
  });

  describe('handleImageUpdate', () => {
    it('should rename, move, and update doc image if publicId exists', async () => {
      tempUploadsService.get.mockReturnValue('temp-id');

      (cloudinary.uploader.rename as jest.Mock).mockResolvedValue({
        public_id: 'renamed',
      });

      (cloudinary.uploader.explicit as jest.Mock).mockResolvedValue({
        public_id: 'moved-id',
        secure_url: 'https://cloudinary.com/moved.png',
      });

      const doc = { ...mockDoc };

      await service.handleImageUpdate(doc, {
        folder: UploadFolder.STAGES,
        secureUrl: 'https://cloudinary.com/image.png',
      });

      expect(doc.imageId).toBe('moved-id');
      expect(doc.imageUrl).toBe('https://cloudinary.com/moved.png');
      expect(tempUploadsService.remove).toHaveBeenCalledWith(
        'https://cloudinary.com/image.png',
      );
    });

    it('should destroy old image if replacing with non-cloudinary URL', async () => {
      tempUploadsService.get.mockReturnValue(undefined);

      const destroySpy = cloudinary.uploader.destroy as jest.Mock;
      destroySpy.mockResolvedValue({});

      const doc = { ...mockDoc };
      await service.handleImageUpdate(doc, {
        folder: UploadFolder.STAGES,
        secureUrl: 'https://example.com/new.png',
        destroyOnReplace: true,
      });

      expect(destroySpy).toHaveBeenCalledWith('old-id');
      expect(doc.imageId).toBeUndefined();
    });

    it('should not destroy if destroyOnReplace=false', async () => {
      tempUploadsService.get.mockReturnValue(undefined);

      const destroySpy = cloudinary.uploader.destroy as jest.Mock;

      const doc = { ...mockDoc };
      await service.handleImageUpdate(doc, {
        folder: UploadFolder.STAGES,
        secureUrl: 'https://cloudinary.com/new.png',
        destroyOnReplace: false,
      });

      expect(destroySpy).not.toHaveBeenCalled();
      expect(doc.imageId).toBe('old-id');
    });

    it('should log error if destroy fails', async () => {
      tempUploadsService.get.mockReturnValue(undefined);

      (cloudinary.uploader.destroy as jest.Mock).mockRejectedValue(
        new Error('destroy-fail'),
      );

      const doc = { ...mockDoc };
      await service.handleImageUpdate(doc, {
        folder: UploadFolder.STAGES,
        secureUrl: 'https://example.com/new.png',
        destroyOnReplace: true,
      });

      expect(doc.imageId).toBeUndefined();
    });

    it('should log and rethrow error if rename fails', async () => {
      tempUploadsService.get.mockReturnValue('temp-id');
      (cloudinary.uploader.rename as jest.Mock).mockRejectedValue(
        new Error('rename-fail'),
      );

      await expect(
        service.handleImageUpdate(
          { ...mockDoc },
          {
            folder: UploadFolder.STAGES,
            secureUrl: 'https://temp.com/image.png',
          },
        ),
      ).rejects.toThrow('rename-fail');
    });
  });

  describe('handleImageDeletion', () => {
    it('should call cloudinary destroy', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({});
      await service.handleImageDeletion('public-id');
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('public-id');
    });

    it('should log error if destroy fails', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockRejectedValue(
        new Error('fail'),
      );
      await service.handleImageDeletion('bad-id');
      expect(Logger.prototype.error).toHaveBeenCalled();
    });
  });
});
