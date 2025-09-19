import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { Types } from 'mongoose';

export function IsObjectId(validationOptions?: ValidationOptions) {
  return applyDecorators(
    Transform(({ value }) => {
      if (typeof value === 'string' && Types.ObjectId.isValid(value)) {
        return new Types.ObjectId(value);
      }
      return value;
    }),
    function (target: any, propertyName: string) {
      registerDecorator({
        name: 'isObjectId',
        target: target.constructor,
        propertyName: propertyName,
        options: validationOptions,
        validator: {
          validate(value: any, args: ValidationArguments) {
            if (value instanceof Types.ObjectId) {
              return true;
            }
            if (typeof value === 'string') {
              return Types.ObjectId.isValid(value);
            }
            return false;
          },
          defaultMessage(args: ValidationArguments) {
            return `${args.property} must be a valid MongoDB ObjectId`;
          },
        },
      });
    },
  );
}
