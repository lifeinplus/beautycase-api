import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { multerConfig } from './config/multer.config';
import { UploadFileDto } from './dto/upload-file.dto';
import { UploadUrlDto } from './dto/upload-url.dto';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadService: UploadsService) {}

  @Post('temp-image-file')
  @UseInterceptors(FileInterceptor('imageFile', multerConfig))
  async uploadTempImageByFile(
    @Body() dto: UploadFileDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const secureUrl = await this.uploadService.uploadTempImageByFile(
      dto.folder,
      file,
    );

    return { imageUrl: secureUrl };
  }

  @Post('temp-image-url')
  async uploadTempImageByUrl(@Body() dto: UploadUrlDto) {
    const secureUrl = await this.uploadService.uploadTempImageByUrl(
      dto.folder,
      dto.imageUrl,
    );

    return { imageUrl: secureUrl };
  }
}
