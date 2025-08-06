import { Module } from '@nestjs/common';
import { ImageService } from './image.service';
import { TempUploadsService } from './temp-uploads.service';

@Module({
  providers: [ImageService, TempUploadsService],
  exports: [ImageService, TempUploadsService],
})
export class SharedModule {}
