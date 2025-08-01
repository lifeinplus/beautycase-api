import { PartialType } from '@nestjs/mapped-types';
import { CreateMakeupBagDto } from './create-makeup-bag.dto';

export class UpdateMakeupBagDto extends PartialType(CreateMakeupBagDto) {}
