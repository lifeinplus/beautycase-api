import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from 'src/common/enums/role.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class User {
  @Prop({
    required: true,
    enum: Role,
    default: Role.CLIENT,
  })
  role: Role;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, unique: true, trim: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: [String], default: [] })
  refreshTokens: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
