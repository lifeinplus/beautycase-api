import { IsEnum, IsNotEmpty } from 'class-validator';

import { UploadFolder } from '../enums/upload-folder.enum';

export class UploadFileDto {
  @IsNotEmpty()
  @IsEnum(UploadFolder)
  folder: UploadFolder;
}
