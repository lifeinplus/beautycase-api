import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';

import { TempUploadsService } from 'src/modules/shared/temp-uploads.service';

@Injectable()
export class UploadService {
  constructor(
    private readonly tempUploadsService: TempUploadsService,
    private readonly configService: ConfigService,
  ) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadTempImageByFile(
    folder: string,
    file?: Express.Multer.File,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('File upload failed');
    }

    const fileStr = file.buffer.toString('base64');
    const dataUri = `data:${file.mimetype};base64,${fileStr}`;

    const options: UploadApiOptions = {
      folder: `${folder}/temp`,
      overwrite: true,
      resource_type: 'auto',
      unique_filename: true,
      use_filename: false,
    };

    try {
      const uploadResponse = await cloudinary.uploader.upload(dataUri, options);

      this.tempUploadsService.store(
        uploadResponse.secure_url,
        uploadResponse.public_id,
      );

      return uploadResponse.secure_url;
    } catch (error) {
      throw new BadRequestException('Failed to upload image to Cloudinary');
    }
  }

  async uploadTempImageByUrl(
    folder: string,
    imageUrl: string,
  ): Promise<string> {
    const options: UploadApiOptions = {
      folder: `${folder}/temp`,
      format: 'jpg',
      overwrite: true,
      resource_type: 'auto',
      unique_filename: true,
      use_filename: false,
    };

    try {
      const uploadResponse = await cloudinary.uploader.upload(
        imageUrl,
        options,
      );

      this.tempUploadsService.store(
        uploadResponse.secure_url,
        uploadResponse.public_id,
      );

      return uploadResponse.secure_url;
    } catch (error) {
      throw new BadRequestException('Failed to upload image from URL');
    }
  }
}
