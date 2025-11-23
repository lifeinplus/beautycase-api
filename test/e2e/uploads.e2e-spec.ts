import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { UploadFolder } from 'src/common/enums/upload-folder.enum';
import configuration from 'src/config/configuration';
import { SharedModule } from 'src/modules/shared/shared.module';
import { UploadsModule } from 'src/modules/uploads/uploads.module';
import { getCloudinaryMocks } from 'test/mocks/cloudinary.mock';

jest.mock('cloudinary', () =>
  require('test/mocks/cloudinary.mock').mockCloudinary(),
);

describe('Uploads (e2e)', () => {
  let app: INestApplication;
  let cloudinaryMocks: ReturnType<typeof getCloudinaryMocks>;

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
  });

  beforeEach(() => {
    cloudinaryMocks = getCloudinaryMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /uploads/temp-image', () => {
    const mockImageBuffer = Buffer.from('fake-image-data');

    it('should upload image file successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/uploads/temp-image')
        .field('folder', UploadFolder.PRODUCTS)
        .attach('imageFile', mockImageBuffer, 'test-image.jpg')
        .expect(HttpStatus.CREATED);

      expect(response.body).toEqual({
        imageId: 'mocked-upload',
      });

      expect(cloudinaryMocks.upload).toHaveBeenCalledWith(
        expect.stringMatching(/^data:image\/jpeg;base64,/),
        expect.objectContaining({
          folder: 'products/temp',
          resource_type: 'auto',
          overwrite: true,
          unique_filename: true,
          use_filename: false,
        }),
      );
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
          .post('/uploads/temp-image')
          .field('folder', folder)
          .attach('imageFile', mockImageBuffer, 'test.jpg')
          .expect(HttpStatus.CREATED);

        expect(cloudinaryMocks.upload).toHaveBeenCalledWith(
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
          .post('/uploads/temp-image')
          .field('folder', UploadFolder.PRODUCTS)
          .attach('imageFile', mockImageBuffer, format.filename)
          .expect(HttpStatus.CREATED);

        expect(cloudinaryMocks.upload).toHaveBeenCalledWith(
          expect.stringMatching(new RegExp(`^data:${format.mimetype};base64,`)),
          expect.any(Object),
        );
      }
    });

    it('should reject invalid file types', async () => {
      cloudinaryMocks.upload.mockClear();

      await request(app.getHttpServer())
        .post('/uploads/temp-image')
        .field('folder', UploadFolder.PRODUCTS)
        .attach('imageFile', Buffer.from('not-an-image'), 'test.txt')
        .expect(HttpStatus.BAD_REQUEST);

      expect(cloudinaryMocks.upload).not.toHaveBeenCalled();
    });

    it('should reject files exceeding size limit', async () => {
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB

      await request(app.getHttpServer())
        .post('/uploads/temp-image')
        .field('folder', UploadFolder.PRODUCTS)
        .attach('imageFile', largeBuffer, 'large-image.jpg')
        .expect(HttpStatus.PAYLOAD_TOO_LARGE);

      expect(cloudinaryMocks.upload).not.toHaveBeenCalled();
    });

    it('should reject invalid folder values', async () => {
      await request(app.getHttpServer())
        .post('/uploads/temp-image')
        .field('folder', 'invalid-folder')
        .attach('imageFile', mockImageBuffer, 'test.jpg')
        .expect(HttpStatus.BAD_REQUEST);

      expect(cloudinaryMocks.upload).not.toHaveBeenCalled();
    });

    it('should reject requests without folder field', async () => {
      await request(app.getHttpServer())
        .post('/uploads/temp-image')
        .attach('imageFile', mockImageBuffer, 'test.jpg')
        .expect(HttpStatus.BAD_REQUEST);

      expect(cloudinaryMocks.upload).not.toHaveBeenCalled();
    });

    it('should reject requests without file', async () => {
      await request(app.getHttpServer())
        .post('/uploads/temp-image')
        .field('folder', UploadFolder.PRODUCTS)
        .expect(HttpStatus.BAD_REQUEST);

      expect(cloudinaryMocks.upload).not.toHaveBeenCalled();
    });

    it('should handle Cloudinary upload failures', async () => {
      cloudinaryMocks.upload.mockRejectedValue(new Error('Cloudinary error'));

      await request(app.getHttpServer())
        .post('/uploads/temp-image')
        .field('folder', UploadFolder.PRODUCTS)
        .attach('imageFile', mockImageBuffer, 'test.jpg')
        .expect(HttpStatus.BAD_REQUEST);

      expect(cloudinaryMocks.upload).toHaveBeenCalled();
    });
  });

  describe('Content-Type handling', () => {
    beforeEach(() => {
      cloudinaryMocks.upload.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/image.jpg',
        public_id: 'test_123',
      });
    });

    it('should handle multipart/form-data for file uploads', async () => {
      const response = await request(app.getHttpServer())
        .post('/uploads/temp-image')
        .set('Content-Type', 'multipart/form-data')
        .field('folder', UploadFolder.PRODUCTS)
        .attach('imageFile', Buffer.from('test'), 'test.jpg');

      expect(response.status).toBe(HttpStatus.CREATED);
    });
  });
});
