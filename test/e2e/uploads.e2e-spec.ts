import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { v2 as cloudinary } from 'cloudinary';
import * as request from 'supertest';

import { UploadFolder } from 'src/common/enums/upload-folder.enum';
import configuration from 'src/config/configuration';
import { SharedModule } from 'src/modules/shared/shared.module';
import { TempUploadsService } from 'src/modules/shared/temp-uploads.service';
import { UploadsModule } from 'src/modules/uploads/uploads.module';

jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload: jest.fn(),
    },
    config: jest.fn(),
  },
}));

describe('Uploads (e2e)', () => {
  let app: INestApplication;
  let tempUploadsService: TempUploadsService;

  const mockCloudinaryUpload = cloudinary.uploader.upload as jest.Mock;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
          envFilePath: '.env.test.local',
        }),
        SharedModule,
        UploadsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    await app.init();

    tempUploadsService = app.get<TempUploadsService>(TempUploadsService);
  });

  beforeEach(async () => {
    mockCloudinaryUpload.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /uploads/temp-image-file', () => {
    const mockImageBuffer = Buffer.from('fake-image-data');

    beforeEach(() => {
      mockCloudinaryUpload.mockResolvedValue({
        secure_url:
          'https://res.cloudinary.com/test/image/upload/v123456789/products/temp/image.jpg',
        public_id: 'products/temp/image_123456789',
      });
    });

    it('should upload image file successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/uploads/temp-image-file')
        .field('folder', UploadFolder.PRODUCTS)
        .attach('imageFile', mockImageBuffer, 'test-image.jpg')
        .expect(HttpStatus.CREATED);

      expect(response.body).toEqual({
        imageUrl:
          'https://res.cloudinary.com/test/image/upload/v123456789/products/temp/image.jpg',
      });

      expect(mockCloudinaryUpload).toHaveBeenCalledWith(
        expect.stringMatching(/^data:image\/jpeg;base64,/),
        expect.objectContaining({
          folder: 'products/temp',
          resource_type: 'auto',
          overwrite: true,
          unique_filename: true,
          use_filename: false,
        }),
      );

      // Verify temp upload was stored
      const storedPublicId = tempUploadsService.get(response.body.imageUrl);
      expect(storedPublicId).toBe('products/temp/image_123456789');
    });

    it('should work with all valid upload folders', async () => {
      const folders = [
        UploadFolder.PRODUCTS,
        UploadFolder.QUESTIONNAIRES,
        UploadFolder.STAGES,
        UploadFolder.TOOLS,
      ];

      for (const folder of folders) {
        await request(app.getHttpServer())
          .post('/uploads/temp-image-file')
          .field('folder', folder)
          .attach('imageFile', mockImageBuffer, 'test.jpg')
          .expect(HttpStatus.CREATED);

        expect(mockCloudinaryUpload).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            folder: `${folder}/temp`,
          }),
        );
      }
    });

    it('should handle different image formats', async () => {
      const formats = [
        { filename: 'test.jpg', mimetype: 'image/jpeg' },
        { filename: 'test.png', mimetype: 'image/png' },
        { filename: 'test.heic', mimetype: 'image/heic' },
      ];

      for (const format of formats) {
        await request(app.getHttpServer())
          .post('/uploads/temp-image-file')
          .field('folder', UploadFolder.PRODUCTS)
          .attach('imageFile', mockImageBuffer, format.filename)
          .expect(HttpStatus.CREATED);

        expect(mockCloudinaryUpload).toHaveBeenCalledWith(
          expect.stringMatching(new RegExp(`^data:${format.mimetype};base64,`)),
          expect.any(Object),
        );
      }
    });

    it('should reject invalid file types', async () => {
      await request(app.getHttpServer())
        .post('/uploads/temp-image-file')
        .field('folder', UploadFolder.PRODUCTS)
        .attach('imageFile', Buffer.from('not-an-image'), 'test.txt')
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockCloudinaryUpload).not.toHaveBeenCalled();
    });

    it('should reject files exceeding size limit', async () => {
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB

      await request(app.getHttpServer())
        .post('/uploads/temp-image-file')
        .field('folder', UploadFolder.PRODUCTS)
        .attach('imageFile', largeBuffer, 'large-image.jpg')
        .expect(HttpStatus.PAYLOAD_TOO_LARGE);

      expect(mockCloudinaryUpload).not.toHaveBeenCalled();
    });

    it('should reject invalid folder values', async () => {
      await request(app.getHttpServer())
        .post('/uploads/temp-image-file')
        .field('folder', 'invalid-folder')
        .attach('imageFile', mockImageBuffer, 'test.jpg')
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockCloudinaryUpload).not.toHaveBeenCalled();
    });

    it('should reject requests without folder field', async () => {
      await request(app.getHttpServer())
        .post('/uploads/temp-image-file')
        .attach('imageFile', mockImageBuffer, 'test.jpg')
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockCloudinaryUpload).not.toHaveBeenCalled();
    });

    it('should reject requests without file', async () => {
      await request(app.getHttpServer())
        .post('/uploads/temp-image-file')
        .field('folder', UploadFolder.PRODUCTS)
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockCloudinaryUpload).not.toHaveBeenCalled();
    });

    it('should handle Cloudinary upload failures', async () => {
      mockCloudinaryUpload.mockRejectedValue(new Error('Cloudinary error'));

      await request(app.getHttpServer())
        .post('/uploads/temp-image-file')
        .field('folder', UploadFolder.PRODUCTS)
        .attach('imageFile', mockImageBuffer, 'test.jpg')
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockCloudinaryUpload).toHaveBeenCalled();
    });
  });

  describe('POST /uploads/temp-image-url', () => {
    beforeEach(() => {
      mockCloudinaryUpload.mockResolvedValue({
        secure_url:
          'https://res.cloudinary.com/test/image/upload/v123456789/stages/temp/url-image.jpg',
        public_id: 'stages/temp/url-image_123456789',
      });
    });

    it('should upload image from URL successfully', async () => {
      const dto = {
        folder: UploadFolder.STAGES,
        imageUrl: 'https://example.com/test-image.jpg',
      };

      const response = await request(app.getHttpServer())
        .post('/uploads/temp-image-url')
        .send(dto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toEqual({
        imageUrl:
          'https://res.cloudinary.com/test/image/upload/v123456789/stages/temp/url-image.jpg',
      });

      expect(mockCloudinaryUpload).toHaveBeenCalledWith(
        'https://example.com/test-image.jpg',
        expect.objectContaining({
          folder: 'stages/temp',
          format: 'jpg',
          overwrite: true,
          resource_type: 'auto',
          unique_filename: true,
          use_filename: false,
        }),
      );

      // Verify temp upload was stored
      const storedPublicId = tempUploadsService.get(response.body.imageUrl);
      expect(storedPublicId).toBe('stages/temp/url-image_123456789');
    });

    it('should work with all valid upload folders', async () => {
      const folders = [
        UploadFolder.PRODUCTS,
        UploadFolder.QUESTIONNAIRES,
        UploadFolder.STAGES,
        UploadFolder.TOOLS,
      ];

      for (const folder of folders) {
        const dto = {
          folder,
          imageUrl: 'https://example.com/test.jpg',
        };

        await request(app.getHttpServer())
          .post('/uploads/temp-image-url')
          .send(dto)
          .expect(HttpStatus.CREATED);

        expect(mockCloudinaryUpload).toHaveBeenCalledWith(
          'https://example.com/test.jpg',
          expect.objectContaining({
            folder: `${folder}/temp`,
          }),
        );
      }
    });

    it('should reject invalid folder values', async () => {
      const dto = {
        folder: 'invalid-folder',
        imageUrl: 'https://example.com/test.jpg',
      };

      await request(app.getHttpServer())
        .post('/uploads/temp-image-url')
        .send(dto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockCloudinaryUpload).not.toHaveBeenCalled();
    });

    it('should reject invalid URLs', async () => {
      const dto = {
        folder: UploadFolder.PRODUCTS,
        imageUrl: 'not-a-valid-url',
      };

      await request(app.getHttpServer())
        .post('/uploads/temp-image-url')
        .send(dto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockCloudinaryUpload).not.toHaveBeenCalled();
    });

    it('should reject requests without folder field', async () => {
      const dto = {
        imageUrl: 'https://example.com/test.jpg',
      };

      await request(app.getHttpServer())
        .post('/uploads/temp-image-url')
        .send(dto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockCloudinaryUpload).not.toHaveBeenCalled();
    });

    it('should reject requests without imageUrl field', async () => {
      const dto = {
        folder: UploadFolder.PRODUCTS,
      };

      await request(app.getHttpServer())
        .post('/uploads/temp-image-url')
        .send(dto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockCloudinaryUpload).not.toHaveBeenCalled();
    });

    it('should reject empty request body', async () => {
      await request(app.getHttpServer())
        .post('/uploads/temp-image-url')
        .send({})
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockCloudinaryUpload).not.toHaveBeenCalled();
    });

    it('should handle Cloudinary upload failures', async () => {
      mockCloudinaryUpload.mockRejectedValue(new Error('Cloudinary error'));

      const dto = {
        folder: UploadFolder.PRODUCTS,
        imageUrl: 'https://example.com/test.jpg',
      };

      await request(app.getHttpServer())
        .post('/uploads/temp-image-url')
        .send(dto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockCloudinaryUpload).toHaveBeenCalled();
    });
  });

  describe('TempUploadsService Integration', () => {
    beforeEach(() => {
      mockCloudinaryUpload.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/image.jpg',
        public_id: 'test/temp/image_123',
      });
    });

    it('should store temp uploads for file uploads', async () => {
      const response = await request(app.getHttpServer())
        .post('/uploads/temp-image-file')
        .field('folder', UploadFolder.PRODUCTS)
        .attach('imageFile', Buffer.from('test'), 'test.jpg')
        .expect(HttpStatus.CREATED);

      const publicId = tempUploadsService.get(response.body.imageUrl);
      expect(publicId).toBe('test/temp/image_123');
    });

    it('should store temp uploads for URL uploads', async () => {
      const dto = {
        folder: UploadFolder.STAGES,
        imageUrl: 'https://example.com/test.jpg',
      };

      const response = await request(app.getHttpServer())
        .post('/uploads/temp-image-url')
        .send(dto)
        .expect(HttpStatus.CREATED);

      const publicId = tempUploadsService.get(response.body.imageUrl);
      expect(publicId).toBe('test/temp/image_123');
    });

    it('should handle multiple uploads in temp service', async () => {
      // Mock different responses for multiple uploads
      mockCloudinaryUpload
        .mockResolvedValueOnce({
          secure_url: 'https://res.cloudinary.com/test/image1.jpg',
          public_id: 'products/temp/image1_123',
        })
        .mockResolvedValueOnce({
          secure_url: 'https://res.cloudinary.com/test/image2.jpg',
          public_id: 'stages/temp/image2_456',
        });

      // First upload
      const response1 = await request(app.getHttpServer())
        .post('/uploads/temp-image-file')
        .field('folder', UploadFolder.PRODUCTS)
        .attach('imageFile', Buffer.from('test1'), 'test1.jpg')
        .expect(HttpStatus.CREATED);

      // Second upload
      const response2 = await request(app.getHttpServer())
        .post('/uploads/temp-image-url')
        .send({
          folder: UploadFolder.STAGES,
          imageUrl: 'https://example.com/test2.jpg',
        })
        .expect(HttpStatus.CREATED);

      // Verify both are stored
      const publicId1 = tempUploadsService.get(response1.body.imageUrl);
      const publicId2 = tempUploadsService.get(response2.body.imageUrl);

      expect(publicId1).toBe('products/temp/image1_123');
      expect(publicId2).toBe('stages/temp/image2_456');
    });
  });

  describe('Content-Type handling', () => {
    beforeEach(() => {
      mockCloudinaryUpload.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/image.jpg',
        public_id: 'test_123',
      });
    });

    it('should handle multipart/form-data for file uploads', async () => {
      const response = await request(app.getHttpServer())
        .post('/uploads/temp-image-file')
        .set('Content-Type', 'multipart/form-data')
        .field('folder', UploadFolder.PRODUCTS)
        .attach('imageFile', Buffer.from('test'), 'test.jpg');

      expect(response.status).toBe(HttpStatus.CREATED);
    });

    it('should handle application/json for URL uploads', async () => {
      const dto = {
        folder: UploadFolder.PRODUCTS,
        imageUrl: 'https://example.com/test.jpg',
      };

      const response = await request(app.getHttpServer())
        .post('/uploads/temp-image-url')
        .set('Content-Type', 'application/json')
        .send(dto);

      expect(response.status).toBe(HttpStatus.CREATED);
    });
  });
});
