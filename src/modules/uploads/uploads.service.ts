import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';

import { ErrorCode } from 'src/common/enums/error-code.enum';
import { UploadFolder } from 'src/common/enums/upload-folder.enum';
import { ImageService } from '../shared/image.service';

@Injectable()
export class UploadsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly imageService: ImageService,
  ) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadTempImage(
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
      folder: `${folder}/${UploadFolder.TEMP}`,
      overwrite: true,
      resource_type: 'auto',
      unique_filename: true,
      use_filename: false,
    };

    try {
      const uploadResponse = await cloudinary.uploader.upload(dataUri, options);
      return uploadResponse.public_id;
    } catch (error) {
      throw new BadRequestException({
        code: ErrorCode.IMAGE_UPLOAD_FAILED,
        message: 'Failed to upload image to Cloudinary',
      });
    }
  }

  async remove(imageId: string): Promise<void> {
    return await this.imageService.deleteImage(imageId);
  }
}
