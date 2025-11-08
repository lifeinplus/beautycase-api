import { Types } from 'mongoose';

export const makeObjectId = (): string => new Types.ObjectId().toString();
