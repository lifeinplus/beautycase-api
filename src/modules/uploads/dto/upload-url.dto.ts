import { IsEnum, IsNotEmpty, IsUrl } from 'class-validator';

import { UploadFolder } from '../enums/upload-folder.enum';

export class UploadUrlDto {
  @IsNotEmpty()
  @IsEnum(UploadFolder)
  folder: UploadFolder;

  @IsNotEmpty()
  @IsUrl()
  imageUrl: string;
}
