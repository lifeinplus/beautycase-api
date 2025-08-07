import { IsEnum, IsNotEmpty } from 'class-validator';

import { UploadFolder } from 'src/common/enums/upload-folder.enum';

export class UploadFileDto {
  @IsNotEmpty()
  @IsEnum(UploadFolder)
  folder: UploadFolder;
}
