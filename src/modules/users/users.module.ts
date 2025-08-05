import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { LessonsModule } from '../lessons/lessons.module';
import { MakeupBagsModule } from '../makeup-bags/makeup-bags.module';
import { User, UserSchema } from './schemas/user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    LessonsModule,
    MakeupBagsModule,
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
