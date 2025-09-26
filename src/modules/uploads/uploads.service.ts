import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';

import { ErrorCode } from 'src/common/enums/error-code.enum';
import { UploadFolder } from 'src/common/enums/upload-folder.enum';
import { TempUploadsService } from 'src/modules/shared/temp-uploads.service';

@Injectable()
export class UploadsService {
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
    folder: UploadFolder,
    file?: Express.Multer.File,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException({
        code: ErrorCode.IMAGE_UPLOAD_FAILED,
        message: 'No file provided for upload',
      });
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
      throw new BadRequestException({
        code: ErrorCode.IMAGE_UPLOAD_FAILED,
        message: 'Failed to upload image to Cloudinary',
      });
    }
  }

  async uploadTempImageByUrl(
    folder: UploadFolder,
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
      throw new BadRequestException({
        code: ErrorCode.IMAGE_UPLOAD_FAILED,
        message: 'Failed to upload image from URL',
      });
    }
  }
}
