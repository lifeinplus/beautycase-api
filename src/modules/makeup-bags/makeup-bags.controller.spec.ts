import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { MongoIdParamDto } from 'src/common/dto/mongo-id-param.dto';
import { TestDataFactory } from 'test/factories/test-data.factory';
import { UpdateMakeupBagDto } from './dto/update-makeup-bag.dto';
import { MakeupBagsController } from './makeup-bags.controller';
import { MakeupBagsService } from './makeup-bags.service';

describe('MakeupBagsController', () => {
  let controller: MakeupBagsController;

  const mockMakeupBag = TestDataFactory.createMakeupBag(
    'cat-id',
    'client-id',
    ['stage-id'],
    ['tool-id'],
  );

  const mockMakeupBagResponse = {
    ...mockMakeupBag,
    id: 'makeupbag-id',
  };

  const mockMakeupBagsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MakeupBagsController],
      providers: [
        {
          provide: MakeupBagsService,
          useValue: mockMakeupBagsService,
        },
      ],
    }).compile();

    controller = module.get<MakeupBagsController>(MakeupBagsController);
  });

  describe('create', () => {
    it('should create a makeup bag and return id + message', async () => {
      mockMakeupBagsService.create.mockResolvedValue(
        mockMakeupBagResponse as any,
      );

      const result = await controller.create(mockMakeupBag);

      expect(mockMakeupBagsService.create).toHaveBeenCalledWith(mockMakeupBag);
      expect(result).toEqual({
        id: 'makeupbag-id',
        message: 'MakeupBag created successfully',
      });
    });
  });

  describe('findAll', () => {
    it('should return all makeup bags', async () => {
      mockMakeupBagsService.findAll.mockResolvedValue([mockMakeupBagResponse]);

      const result = await controller.findAll();

      expect(mockMakeupBagsService.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockMakeupBagResponse]);
    });
  });

  describe('findOne', () => {
    it('should return makeup bag by id', async () => {
      mockMakeupBagsService.findOne.mockResolvedValue(mockMakeupBagResponse);

      const params: MongoIdParamDto = { id: 'makeupbag-id' };
      const result = await controller.findOne(params);

      expect(mockMakeupBagsService.findOne).toHaveBeenCalledWith(
        'makeupbag-id',
      );
      expect(result).toEqual(mockMakeupBagResponse);
    });

    it('should throw NotFoundException if not found', async () => {
      mockMakeupBagsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne({ id: 'bad-id' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a makeup bag and return id + message', async () => {
      mockMakeupBagsService.update.mockResolvedValue(mockMakeupBagResponse);

      const params: MongoIdParamDto = { id: 'makeupbag-id' };
      const dto: UpdateMakeupBagDto = { stageIds: ['new-stage'] };

      const result = await controller.update(params, dto);

      expect(mockMakeupBagsService.update).toHaveBeenCalledWith(
        'makeupbag-id',
        dto,
      );
      expect(result).toEqual({
        id: 'makeupbag-id',
        message: 'MakeupBag updated successfully',
      });
    });
  });

  describe('remove', () => {
    it('should delete a makeup bag and return id + message', async () => {
      mockMakeupBagsService.remove.mockResolvedValue(mockMakeupBagResponse);

      const params: MongoIdParamDto = { id: 'makeupbag-id' };
      const result = await controller.remove(params);

      expect(mockMakeupBagsService.remove).toHaveBeenCalledWith('makeupbag-id');
      expect(result).toEqual({
        id: 'makeupbag-id',
        message: 'MakeupBag deleted successfully',
      });
    });
  });
});
