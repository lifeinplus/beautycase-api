import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { LessonsService } from '../lessons/lessons.service';
import { MakeupBagsService } from '../makeup-bags/makeup-bags.service';
import { User } from './schemas/user.schema';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

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

  const mockUser = {
    _id: 'user-id',
    username: 'john_doe',
    role: 'client',
    refreshTokens: ['token1'],
  };

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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', async () => {
      mockUserModel.create.mockResolvedValue(mockUser);

      const dto = { username: 'john_doe', password: 'pass1234' } as any;
      const result = await service.create(dto);

      expect(mockUserModel.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([mockUser]),
      });

      const result = await service.findAll();
      expect(result).toEqual([mockUser]);
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
        select: jest.fn().mockResolvedValue(mockUser),
      });
      mockLessonsService.getByClientId.mockResolvedValue(['lesson1'] as any);
      mockMakeupBagsService.findByClientId.mockResolvedValue(['bag1'] as any);

      const result = await service.findOne('user-id');

      expect(mockUserModel.findById).toHaveBeenCalledWith('user-id');
      expect(result).toEqual({
        user: mockUser,
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
      mockUserModel.findOne.mockResolvedValue(mockUser);

      const result = await service.findByRefreshToken('token1');
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        refreshTokens: 'token1',
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findByUsername', () => {
    it('should return user by username', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);

      const result = await service.findByUsername('john_doe');
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        username: 'john_doe',
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateRefreshTokens', () => {
    it('should update refresh tokens', async () => {
      mockUserModel.findByIdAndUpdate.mockResolvedValue({
        ...mockUser,
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
