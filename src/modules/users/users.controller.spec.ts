import { Test, TestingModule } from '@nestjs/testing';

import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ObjectIdParamDto } from 'src/common/dto/object-id-param.dto';
import { TestDataFactory } from 'test/factories/test-data.factory';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser = TestDataFactory.createClientUser();
  const mockUserId = new Types.ObjectId();
  const mockBadUserId = new Types.ObjectId();

  const mockUserResponse = {
    ...mockUser,
    _id: mockUserId,
  };

  const mockUsersService = {
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue({ id: '1', name: 'Test User' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      mockUsersService.findAll.mockResolvedValue([mockUserResponse]);

      const result = await controller.findAll();

      expect(mockUsersService.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockUserResponse]);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUserResponse);

      const params: ObjectIdParamDto = { id: mockUserId };
      const result = await controller.findOne(params);

      expect(mockUsersService.findOne).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockUserResponse);
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockUsersService.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne({ id: mockBadUserId })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
