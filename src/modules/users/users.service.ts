import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { ErrorCode } from 'src/common/enums/error-code.enum';
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
    const users = await this.userModel
      .find()
      .select('-password -refreshTokens');

    if (!users.length) {
      throw new NotFoundException({ code: ErrorCode.USERS_NOT_FOUND });
    }

    return users;
  }

  async findAllMuas() {
    const users = await this.userModel
      .find({ role: 'mua' })
      .select('username role');

    if (!users.length) {
      throw new NotFoundException({ code: ErrorCode.USERS_NOT_FOUND });
    }

    return users;
  }

  async findOne(id: Types.ObjectId) {
    const user = await this.userModel
      .findById(id)
      .select('-password -refreshTokens');

    if (!user) {
      throw new NotFoundException({ code: ErrorCode.USER_NOT_FOUND });
    }

    const lessons = await this.lessonsService.findByClientId(id);
    const makeupBags = await this.makeupBagsService.findByClientId(id);

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

  async remove(id: Types.ObjectId): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndDelete(id);

    if (!user) {
      throw new NotFoundException({ code: ErrorCode.USER_NOT_FOUND });
    }

    return user;
  }
}
