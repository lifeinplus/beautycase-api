import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { ErrorCode } from 'src/common/enums/error-code.enum';
import { TestDataFactory } from 'test/factories/test-data.factory';
import { makeObjectId } from 'test/helpers/make-object-id.helper';
import { LessonsService } from '../lessons/lessons.service';
import { MakeupBagsService } from '../makeup-bags/makeup-bags.service';
import { User } from './schemas/user.schema';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  const mockUser = TestDataFactory.createClientUser();
  const mockUserId = makeObjectId();
  const mockBadUserId = makeObjectId();

  const mockUserResponse = {
    ...mockUser,
    _id: mockUserId,
    refreshTokens: ['token1'],
  };

  const mockUserModel = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  const mockLessonsService = {
    findByClientId: jest.fn(),
  };

  const mockMakeupBagsService = {
    findByClientId: jest.fn(),
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
      const sortMock = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue([mockUserResponse]),
      });

      mockUserModel.find.mockReturnValue({
        sort: sortMock,
      });

      const result = await service.findAll();

      expect(mockUserModel.find).toHaveBeenCalled();
      expect(sortMock).toHaveBeenCalledWith({ updatedAt: 'desc' });
      expect(result).toEqual([mockUserResponse]);
    });

    it('should throw NotFoundException if no users found', async () => {
      const sortMock = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });

      mockUserModel.find.mockReturnValue({
        sort: sortMock,
      });

      await expect(service.findAll()).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllClients', () => {
    it('should return all clients', async () => {
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([mockUserResponse]),
      });

      const result = await service.findAllClients();

      expect(mockUserModel.find).toHaveBeenCalled();
      expect(result).toEqual([mockUserResponse]);
    });

    it('should throw NotFoundException if no clients found', async () => {
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });

      await expect(service.findAllClients()).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllMuas', () => {
    it('should return all muas', async () => {
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([mockUserResponse]),
      });

      const result = await service.findAllMuas();

      expect(mockUserModel.find).toHaveBeenCalled();
      expect(result).toEqual([mockUserResponse]);
    });

    it('should throw NotFoundException if no muas found', async () => {
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });

      await expect(service.findAllMuas()).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return user with lessons and makeupBags', async () => {
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserResponse),
      });
      mockLessonsService.findByClientId.mockResolvedValue(['lesson1'] as any);
      mockMakeupBagsService.findByClientId.mockResolvedValue(['bag1'] as any);

      const result = await service.findOne(mockUserId);

      expect(mockUserModel.findById).toHaveBeenCalledWith(mockUserId);
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

      await expect(service.findOne(mockBadUserId)).rejects.toThrow(
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

      const result = await service.updateRefreshTokens(mockUserId, ['token2']);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        { refreshTokens: ['token2'] },
        { new: true },
      );
      expect(result?.refreshTokens).toEqual(['token2']);
    });
  });

  describe('remove', () => {
    it('should successfully remove a user', async () => {
      mockUserModel.findByIdAndDelete.mockResolvedValue(mockUserResponse);

      const result = await service.remove(mockUserId);

      expect(mockUserModel.findByIdAndDelete).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockUserResponse);
    });

    it('should throw NotFoundException when user to remove is not found', async () => {
      mockUserModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(service.remove(mockUserId)).rejects.toThrow(
        new NotFoundException({ code: ErrorCode.USER_NOT_FOUND }),
      );

      expect(mockUserModel.findByIdAndDelete).toHaveBeenCalledWith(mockUserId);
    });

    it('should handle removal errors', async () => {
      const error = new Error('Database error');
      mockUserModel.findByIdAndDelete.mockRejectedValue(error);

      await expect(service.remove(mockUserId)).rejects.toThrow(error);
    });
  });
});
