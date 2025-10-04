import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { ObjectIdParamDto } from 'src/common/dto/object-id-param.dto';
import { TestDataFactory } from 'test/factories/test-data.factory';
import { UpdateMakeupBagDto } from './dto/update-makeup-bag.dto';
import { MakeupBagsController } from './makeup-bags.controller';
import { MakeupBagsService } from './makeup-bags.service';

describe('MakeupBagsController', () => {
  let controller: MakeupBagsController;

  const mockCategoryId = new Types.ObjectId();
  const mockClientId = new Types.ObjectId();
  const mockMakeupBagId = new Types.ObjectId();
  const mockBadMakeupBagId = new Types.ObjectId();
  const mockStageId = new Types.ObjectId();
  const mockToolId = new Types.ObjectId();

  const mockMakeupBag = TestDataFactory.createMakeupBag(
    mockCategoryId,
    mockClientId,
    [mockStageId],
    [mockToolId],
  );

  const mockMakeupBagResponse = {
    ...mockMakeupBag,
    id: mockMakeupBagId,
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
      expect(result).toEqual({ id: mockMakeupBagId });
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

      const params: ObjectIdParamDto = { id: mockMakeupBagId };
      const result = await controller.findOne(params);

      expect(mockMakeupBagsService.findOne).toHaveBeenCalledWith(
        mockMakeupBagId,
      );
      expect(result).toEqual(mockMakeupBagResponse);
    });

    it('should throw NotFoundException if not found', async () => {
      mockMakeupBagsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(
        controller.findOne({ id: mockBadMakeupBagId }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a makeup bag and return id + message', async () => {
      mockMakeupBagsService.update.mockResolvedValue(mockMakeupBagResponse);

      const params: ObjectIdParamDto = { id: mockMakeupBagId };
      const dto: UpdateMakeupBagDto = { stageIds: [mockStageId] };

      const result = await controller.update(params, dto);

      expect(mockMakeupBagsService.update).toHaveBeenCalledWith(
        mockMakeupBagId,
        dto,
      );
      expect(result).toEqual({ id: mockMakeupBagId });
    });
  });

  describe('remove', () => {
    it('should delete a makeup bag and return id + message', async () => {
      mockMakeupBagsService.remove.mockResolvedValue(mockMakeupBagResponse);

      const params: ObjectIdParamDto = { id: mockMakeupBagId };
      const result = await controller.remove(params);

      expect(mockMakeupBagsService.remove).toHaveBeenCalledWith(
        mockMakeupBagId,
      );
      expect(result).toEqual({ id: mockMakeupBagId });
    });
  });
});
