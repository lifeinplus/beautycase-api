import {
  Body,
  Controller,
  Delete,
  Post,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { multerConfig } from './config/multer.config';
import { DeleteImageDto } from './dto/delete-image.dto';
import { UploadFileDto } from './dto/upload-file.dto';
import { MulterExceptionFilter } from './filters/multer-exception.filter';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadService: UploadsService) {}

  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(FileInterceptor('imageFile', multerConfig))
  @Post('temp-image')
  async uploadTempImage(
    @Body() dto: UploadFileDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const publicId = await this.uploadService.uploadTempImage(dto.folder, file);

    return { imageId: publicId };
  }

  @Delete('image')
  async remove(@Body() dto: DeleteImageDto) {
    await this.uploadService.remove(dto.imageId);
  }
}
