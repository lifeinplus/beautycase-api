import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

import { StoreLinkDto } from 'src/common/dto/store-link.dto';

export class UpdateStoreLinksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StoreLinkDto)
  storeLinks: StoreLinkDto[];
}
