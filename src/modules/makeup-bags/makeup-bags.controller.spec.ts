import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { MongoIdParamDto } from 'src/common/dto/mongo-id-param.dto';
import { CreateMakeupBagDto } from './dto/create-makeup-bag.dto';
import { UpdateMakeupBagDto } from './dto/update-makeup-bag.dto';
import { MakeupBagsController } from './makeup-bags.controller';
import { MakeupBagsService } from './makeup-bags.service';

describe('MakeupBagsController', () => {
  let controller: MakeupBagsController;

  const mockMakeupBag = {
    id: 'makeupbag-id',
    categoryId: 'cat-id',
    clientId: 'client-id',
    stageIds: ['stage-id'],
    toolIds: ['tool-id'],
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

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a makeup bag and return id + message', async () => {
      mockMakeupBagsService.create.mockResolvedValue(mockMakeupBag as any);

      const dto: CreateMakeupBagDto = {
        categoryId: 'cat-id',
        clientId: 'client-id',
        stageIds: ['stage-id'],
        toolIds: ['tool-id'],
      };

      const result = await controller.create(dto);

      expect(mockMakeupBagsService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        id: 'makeupbag-id',
        message: 'MakeupBag created successfully',
      });
    });
  });

  describe('findAll', () => {
    it('should return all makeup bags', async () => {
      mockMakeupBagsService.findAll.mockResolvedValue([mockMakeupBag]);

      const result = await controller.findAll();

      expect(mockMakeupBagsService.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockMakeupBag]);
    });
  });

  describe('findOne', () => {
    it('should return makeup bag by id', async () => {
      mockMakeupBagsService.findOne.mockResolvedValue(mockMakeupBag);

      const params: MongoIdParamDto = { id: 'makeupbag-id' };
      const result = await controller.findOne(params);

      expect(mockMakeupBagsService.findOne).toHaveBeenCalledWith(
        'makeupbag-id',
      );
      expect(result).toEqual(mockMakeupBag);
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
      mockMakeupBagsService.update.mockResolvedValue(mockMakeupBag);

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
      mockMakeupBagsService.remove.mockResolvedValue(mockMakeupBag);

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
