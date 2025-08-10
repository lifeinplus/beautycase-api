import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { LessonsService } from '../lessons/lessons.service';
import { MakeupBagsService } from '../makeup-bags/makeup-bags.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly lessonsService: LessonsService,
    private readonly makeupBagsService: MakeupBagsService,
  ) {}

  create(dto: CreateUserDto): Promise<UserDocument> {
    return this.userModel.create(dto);
  }

  async findAll() {
    const users = await this.userModel.find().select('_id username');

    if (!users.length) {
      throw new NotFoundException('Users not found');
    }

    return users;
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).select('role username');

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

  findByRefreshToken(token: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ refreshTokens: token });
  }

  findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username });
  }

  updateRefreshTokens(
    userId: string,
    refreshTokens: string[],
  ): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { refreshTokens },
      { new: true },
    );
  }
}
