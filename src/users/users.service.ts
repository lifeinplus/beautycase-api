import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { LessonsService } from 'src/lessons/lessons.service';
import { MakeupBagsService } from 'src/makeup-bags/makeup-bags.service';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly lessonsService: LessonsService,
    private readonly makeupBagsService: MakeupBagsService,
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

    const lessons = await this.lessonsService.getByClientId(id);
    const makeupBags = await this.makeupBagsService.getByClientId(id);

    return {
      user,
      lessons,
      makeupBags,
    };
  }

  async getByRefreshToken(token: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ refreshTokens: token }).exec();
  }

  async getByUsername(username: string): Promise<UserDocument | null> {
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
