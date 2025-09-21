import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { TestDataFactory } from 'test/factories/test-data.factory';
import { LessonsService } from './lessons.service';
import { Lesson } from './schemas/lesson.schema';

describe('LessonsService', () => {
  let service: LessonsService;

  const mockLesson = TestDataFactory.createLesson();
  const mockClientId = new Types.ObjectId();
  const mockLessonId = new Types.ObjectId();
  const mockBadLessonId = new Types.ObjectId();

  const mockLessonResponse = {
    ...mockLesson,
    id: mockLessonId,
  };

  const mockLessonModel = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonsService,
        {
          provide: getModelToken(Lesson.name),
          useValue: mockLessonModel,
        },
      ],
    }).compile();

    service = module.get<LessonsService>(LessonsService);
  });

  describe('create', () => {
    it('should create a lesson', async () => {
      (mockLessonModel.create as jest.Mock).mockResolvedValue(
        mockLessonResponse,
      );

      const result = await service.create(mockLessonResponse as any);

      expect(mockLessonModel.create).toHaveBeenCalledWith(mockLessonResponse);
      expect(result).toEqual(mockLessonResponse);
    });
  });

  describe('findAll', () => {
    it('should return all lessons', async () => {
      (mockLessonModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue([mockLessonResponse]),
      });

      const result = await service.findAll();

      expect(result).toEqual([mockLessonResponse]);
    });

    it('should throw NotFoundException if no lessons found', async () => {
      (mockLessonModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });

      await expect(service.findAll()).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return a lesson with populated products', async () => {
      (mockLessonModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockLessonResponse),
      });

      const result = await service.findOne(mockLessonId);

      expect(mockLessonModel.findById).toHaveBeenCalledWith(mockLessonId);
      expect(result).toEqual(mockLessonResponse);
    });

    it('should throw NotFoundException if not found', async () => {
      (mockLessonModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne(mockBadLessonId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOneWithClientId', () => {
    it('should return a lesson with clientIds only', async () => {
      (mockLessonModel.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockLessonResponse),
      });

      const result = await service.findOneWithClientId(mockLessonId);

      expect(mockLessonModel.findById).toHaveBeenCalledWith(mockLessonId);
      expect(result).toEqual(mockLessonResponse);
    });

    it('should throw NotFoundException if not found', async () => {
      (mockLessonModel.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.findOneWithClientId(mockBadLessonId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getByClientId', () => {
    it('should return lessons by clientId', async () => {
      (mockLessonModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue([mockLessonResponse]),
      });

      const result = await service.findByClientId(mockClientId);

      expect(mockLessonModel.find).toHaveBeenCalledWith({
        clientIds: mockClientId,
      });
      expect(result).toEqual([mockLessonResponse]);
    });
  });

  describe('update', () => {
    it('should update a lesson', async () => {
      (mockLessonModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(
        mockLessonResponse,
      );

      const result = await service.update(mockLessonId, {
        title: 'Updated',
      } as any);

      expect(mockLessonModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockLessonId,
        { title: 'Updated' },
        { new: true, runValidators: true },
      );
      expect(result).toEqual(mockLessonResponse);
    });

    it('should throw NotFoundException if not found', async () => {
      (mockLessonModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await expect(service.update(mockBadLessonId, {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProducts', () => {
    it('should call update with productIds', async () => {
      const dto = { productIds: ['p1', 'p2'] } as any;
      const spy = jest
        .spyOn(service, 'update')
        .mockResolvedValue(mockLessonResponse as any);

      const result = await service.updateProducts(mockLessonId, dto);

      expect(spy).toHaveBeenCalledWith(mockLessonId, dto);
      expect(result).toEqual(mockLessonResponse);
    });
  });

  describe('remove', () => {
    it('should delete a lesson', async () => {
      (mockLessonModel.findByIdAndDelete as jest.Mock).mockResolvedValue(
        mockLessonResponse,
      );

      const result = await service.remove(mockLessonId);

      expect(mockLessonModel.findByIdAndDelete).toHaveBeenCalledWith(
        mockLessonId,
      );
      expect(result).toEqual(mockLessonResponse);
    });

    it('should throw NotFoundException if not found', async () => {
      (mockLessonModel.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      await expect(service.remove(mockBadLessonId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
