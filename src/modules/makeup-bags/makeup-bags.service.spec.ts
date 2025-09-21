import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Types } from 'mongoose';

import { TestDataFactory } from 'test/factories/test-data.factory';
import { UpdateMakeupBagDto } from './dto/update-makeup-bag.dto';
import { MakeupBagsService } from './makeup-bags.service';
import { MakeupBag, MakeupBagDocument } from './schemas/makeup-bag.schema';

type MockModel<T = any> = Partial<Record<keyof Model<T>, jest.Mock>> & {
  new (doc?: any): { save: jest.Mock };
};

describe('MakeupBagsService', () => {
  let service: MakeupBagsService;
  let mockMakeupBagModel: MockModel<MakeupBagDocument>;

  const mockCategoryId = new Types.ObjectId();
  const mockClientId = new Types.ObjectId();
  const mockMakeupBagId = new Types.ObjectId();
  const mockBadMakeupBagId = new Types.ObjectId();

  const mockMakeupBag = TestDataFactory.createMakeupBag(
    mockCategoryId,
    mockClientId,
    ['stage-id'],
    ['tool-id'],
  );

  const mockMakeupBagResponse = {
    ...mockMakeupBag,
    id: mockMakeupBagId,
  };

  beforeEach(async () => {
    mockMakeupBagModel = jest.fn(() => ({
      ...mockMakeupBagResponse,
      save: jest.fn().mockResolvedValue(mockMakeupBagResponse),
    })) as any;

    mockMakeupBagModel.create = jest.fn();
    mockMakeupBagModel.find = jest.fn();
    mockMakeupBagModel.findById = jest.fn();
    mockMakeupBagModel.findByIdAndUpdate = jest.fn();
    mockMakeupBagModel.findByIdAndDelete = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MakeupBagsService,
        {
          provide: getModelToken(MakeupBag.name),
          useValue: mockMakeupBagModel,
        },
      ],
    }).compile();

    service = module.get<MakeupBagsService>(MakeupBagsService);
  });

  describe('create', () => {
    it('should create a makeup bag', async () => {
      (mockMakeupBagModel.create as jest.Mock).mockResolvedValue(
        mockMakeupBagResponse,
      );

      const result = await service.create(mockMakeupBag);

      expect(mockMakeupBagModel.create).toHaveBeenCalledWith(mockMakeupBag);
      expect(result).toEqual(mockMakeupBagResponse);
    });
  });

  describe('findAll', () => {
    it('should return all makeup bags', async () => {
      (mockMakeupBagModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue([mockMakeupBagResponse]),
        }),
      });

      const result = await service.findAll();
      expect(result).toEqual([mockMakeupBagResponse]);
    });

    it('should throw NotFoundException if none found', async () => {
      (mockMakeupBagModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(service.findAll()).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return makeup bag by id', async () => {
      (mockMakeupBagModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockMakeupBagResponse),
      });

      const result = await service.findOne(mockMakeupBagId);
      expect(result).toEqual(mockMakeupBagResponse);
    });

    it('should throw NotFoundException if not found', async () => {
      (mockMakeupBagModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne(mockBadMakeupBagId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOneWithClientId', () => {
    it('should return makeup bag with only clientId', async () => {
      (mockMakeupBagModel.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockMakeupBagResponse),
      });

      const result = await service.findOneWithClientId(mockMakeupBagId);
      expect(result).toEqual(mockMakeupBagResponse);
    });

    it('should throw NotFoundException if not found', async () => {
      (mockMakeupBagModel.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.findOneWithClientId(mockBadMakeupBagId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByClientId', () => {
    it('should return makeup bags by client id', async () => {
      (mockMakeupBagModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue([mockMakeupBagResponse]),
        }),
      });

      const result = await service.findByClientId(mockClientId);
      expect(result).toEqual([mockMakeupBagResponse]);
    });
  });

  describe('update', () => {
    it('should update makeup bag', async () => {
      (mockMakeupBagModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(
        mockMakeupBagResponse,
      );

      const dto: UpdateMakeupBagDto = { stageIds: ['new-stage'] };
      const result = await service.update(mockMakeupBagId, dto);

      expect(mockMakeupBagModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockMakeupBagId,
        dto,
        { new: true, runValidators: true },
      );
      expect(result).toEqual(mockMakeupBagResponse);
    });

    it('should throw NotFoundException if not found', async () => {
      (mockMakeupBagModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.update(mockBadMakeupBagId, {} as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete makeup bag', async () => {
      (mockMakeupBagModel.findByIdAndDelete as jest.Mock).mockResolvedValue(
        mockMakeupBagResponse,
      );

      const result = await service.remove(mockMakeupBagId);
      expect(result).toEqual(mockMakeupBagResponse);
    });

    it('should throw NotFoundException if not found', async () => {
      (mockMakeupBagModel.findByIdAndDelete as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(service.remove(mockBadMakeupBagId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
