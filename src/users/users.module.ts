import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { LessonsModule } from 'src/lessons/lessons.module';
import { User, UserSchema } from './schemas/user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    LessonsModule,
    // MakeupBagsModule,
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
