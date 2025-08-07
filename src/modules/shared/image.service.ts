import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

import { UploadFolder } from 'src/common/enums/upload-folder.enum';
import { TempUploadsService } from './temp-uploads.service';

export interface ImageDocument {
  _id: unknown;
  imageId?: string;
  imageUrl: string;
}

export interface ImageOptions {
  filename?: string;
  folder: UploadFolder;
  secureUrl: string;
  destroyOnReplace?: boolean;
}

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);

  constructor(private readonly tempUploadsService: TempUploadsService) {}

  async handleImageUpload<T extends ImageDocument>(
    doc: T,
    { filename, folder, secureUrl }: ImageOptions,
  ): Promise<void> {
    const publicId = this.tempUploadsService.get(secureUrl);

    if (!publicId) return;

    try {
      const displayName = filename || String(doc._id);

      await cloudinary.uploader.explicit(publicId, {
        asset_folder: folder,
        display_name: displayName,
        invalidate: true,
        type: 'upload',
      });

      const renamed: UploadApiResponse = await cloudinary.uploader.rename(
        publicId,
        `${folder}/${displayName}`,
        { invalidate: true },
      );

      doc.imageId = renamed.public_id;
      doc.imageUrl = renamed.secure_url;

      this.tempUploadsService.remove(secureUrl);
    } catch (error) {
      this.logger.error(`Error handling image upload for "${folder}":`, error);
      throw error;
    }
  }

  async handleImageUpdate<T extends ImageDocument>(
    doc: T,
    { folder, secureUrl, destroyOnReplace = true }: ImageOptions,
  ): Promise<void> {
    const publicId = this.tempUploadsService.get(secureUrl);

    if (publicId) {
      try {
        const renamed: UploadApiResponse = await cloudinary.uploader.rename(
          publicId,
          `${folder}/${String(doc._id)}`,
          { invalidate: true, overwrite: true },
        );

        const moved: UploadApiResponse = await cloudinary.uploader.explicit(
          renamed.public_id,
          {
            asset_folder: folder,
            display_name: String(doc._id),
            invalidate: true,
            type: 'upload',
          },
        );

        doc.imageId = moved.public_id;
        doc.imageUrl = moved.secure_url;

        this.tempUploadsService.remove(secureUrl);
      } catch (error) {
        this.logger.error(
          `Error handling image update for "${folder}":`,
          error,
        );
        throw error;
      }
    }

    if (doc.imageId && !secureUrl.includes('cloudinary')) {
      if (destroyOnReplace) {
        try {
          await cloudinary.uploader.destroy(doc.imageId);
        } catch (error) {
          this.logger.error('Error deleting image:');
          this.logger.error(error);
        }
      }

      doc.imageId = undefined;
    }
  }

  async handleImageDeletion(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      this.logger.error('Error deleting image:');
      this.logger.error(error);
    }
  }
}
