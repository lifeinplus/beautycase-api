import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

import { UploadFolder } from 'src/common/enums/upload-folder.enum';

export interface ImageOptions {
  folder: UploadFolder | string;
  publicId: string;
}

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);

  async uploadImage({ folder, publicId }: ImageOptions): Promise<string> {
    if (!publicId.includes(`/${UploadFolder.TEMP}/`)) {
      return publicId;
    }

    try {
      const moved: UploadApiResponse = await cloudinary.uploader.explicit(
        publicId,
        {
          asset_folder: folder,
          invalidate: true,
          type: 'upload',
        },
      );

      const renamed: UploadApiResponse = await cloudinary.uploader.rename(
        publicId,
        `${folder}/${moved.display_name}`,
        {
          invalidate: true,
        },
      );

      return renamed.public_id;
    } catch (error) {
      this.logger.error(`Error handling image upload for "${folder}":`, error);
      throw error;
    }
  }

  async cloneImage(publicId: string, folder: string): Promise<string> {
    const url = cloudinary.url(publicId, {
      fetch_format: 'auto',
      quality: 'auto',
    });

    const uploaded = await cloudinary.uploader.upload(url, {
      folder,
    });

    return uploaded.public_id;
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, {
        invalidate: true,
      });
    } catch (error) {
      this.logger.error('Error deleting image:', error);
    }
  }

  async deleteFolder(folder: string): Promise<void> {
    try {
      const { resources } = await cloudinary.api.resources({
        type: 'upload',
        prefix: folder + '/',
        max_results: 1,
      });

      if (resources.length === 0) {
        await cloudinary.api.delete_folder(folder);
      } else {
        this.logger.warn(`Folder "${folder}" not empty, skipping deletion`);
      }
    } catch (error) {
      this.logger.error(`Error checking/deleting folder "${folder}":`, error);
    }
  }
}
