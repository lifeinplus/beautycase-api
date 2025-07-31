import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// import { MakeupBagService } from '../makeup-bags/makeup-bags.service';
import { LessonsService } from 'src/lessons/lessons.service';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly lessonService: LessonsService,
    // private readonly makeupBagService: MakeupBagService,
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

    const lessons = await this.lessonService.getByClientId(id);
    // TODO: Create MakeupBag service
    // const makeupBags = await this.makeupBagService.getByClientId(id);

    return {
      user,
      lessons,
      //   makeupBags,
    };
  }

  async findByRefreshToken(token: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ refreshTokens: token }).exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async updateRefreshTokens(
    userId: string,
    refreshTokens: string[],
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(userId, { refreshTokens }, { new: true })
      .exec();
  }
}
