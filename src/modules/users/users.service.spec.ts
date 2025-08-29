import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { TestDataFactory } from 'test/factories/test-data.factory';
import { LessonsService } from '../lessons/lessons.service';
import { MakeupBagsService } from '../makeup-bags/makeup-bags.service';
import { User } from './schemas/user.schema';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  const mockUser = TestDataFactory.createClientUser();

  const mockUserResponse = {
    ...mockUser,
    _id: 'user-id',
    refreshTokens: ['token1'],
  };

  const mockUserModel = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  } as any;

  const mockLessonsService = {
    getByClientId: jest.fn(),
  } as any;

  const mockMakeupBagsService = {
    findByClientId: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: LessonsService,
          useValue: mockLessonsService,
        },
        {
          provide: MakeupBagsService,
          useValue: mockMakeupBagsService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('should create a user', async () => {
      mockUserModel.create.mockResolvedValue(mockUserResponse);

      const result = await service.create(mockUser);

      expect(mockUserModel.create).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUserResponse);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([mockUserResponse]),
      });

      const result = await service.findAll();
      expect(result).toEqual([mockUserResponse]);
    });

    it('should throw NotFoundException if no users found', async () => {
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });

      await expect(service.findAll()).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return user with lessons and makeupBags', async () => {
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserResponse),
      });
      mockLessonsService.getByClientId.mockResolvedValue(['lesson1'] as any);
      mockMakeupBagsService.findByClientId.mockResolvedValue(['bag1'] as any);

      const result = await service.findOne('user-id');

      expect(mockUserModel.findById).toHaveBeenCalledWith('user-id');
      expect(result).toEqual({
        user: mockUserResponse,
        lessons: ['lesson1'],
        makeupBags: ['bag1'],
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByRefreshToken', () => {
    it('should return user by refresh token', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUserResponse);

      const result = await service.findByRefreshToken('token1');
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        refreshTokens: 'token1',
      });
      expect(result).toEqual(mockUserResponse);
    });
  });

  describe('findByUsername', () => {
    it('should return user by username', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUserResponse);

      const result = await service.findByUsername('john_doe');
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        username: 'john_doe',
      });
      expect(result).toEqual(mockUserResponse);
    });
  });

  describe('updateRefreshTokens', () => {
    it('should update refresh tokens', async () => {
      mockUserModel.findByIdAndUpdate.mockResolvedValue({
        ...mockUserResponse,
        refreshTokens: ['token2'],
      });

      const result = await service.updateRefreshTokens('user-id', ['token2']);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user-id',
        { refreshTokens: ['token2'] },
        { new: true },
      );
      expect(result?.refreshTokens).toEqual(['token2']);
    });
  });
});
