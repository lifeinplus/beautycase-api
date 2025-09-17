import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { Types } from 'mongoose';

export function IsObjectId() {
  return applyDecorators(
    Transform(({ value }) => {
      if (typeof value === 'string' && Types.ObjectId.isValid(value)) {
        return new Types.ObjectId(value);
      }
      return value;
    }),
  );
}
