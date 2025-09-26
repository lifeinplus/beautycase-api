import { Types } from 'mongoose';

import { IsObjectId } from '../decorators/objectid.decorator';

export class ObjectIdParamDto {
  @IsObjectId()
  id: Types.ObjectId;
}
