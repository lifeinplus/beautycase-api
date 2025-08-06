import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { SharedModule } from '../shared/shared.module';
import { UploadsController } from './uploads.controller';
import { UploadService } from './uploads.service';

@Module({
  imports: [ConfigModule, SharedModule],
  controllers: [UploadsController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadsModule {}
