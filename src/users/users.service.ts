import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// import { LessonService } from '../lessons/lessons.service';
// import { MakeupBagService } from '../makeup-bags/makeup-bags.service';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    // private readonly makeupBagService: MakeupBagService,
    // private readonly lessonService: LessonService,
  ) {}

  async getAllUsers() {
    const users = await this.userModel.find().select('_id username').exec();

    if (!users.length) {
      throw new NotFoundException('Users not found');
    }

    return users;
  }

  async getUserById(id: string) {
    const user = await this.userModel
      .findById(id)
      .select('role username')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // TODO: Create MakeupBag and Lesson services
    // const makeupBags = await this.makeupBagService.getByClientId(id);
    // const lessons = await this.lessonService.getByClientId(id);

    return {
      user,
      //   makeupBags,
      //   lessons,
    };
  }
}
