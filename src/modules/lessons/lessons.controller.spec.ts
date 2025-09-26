import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { ObjectIdParamDto } from 'src/common/dto/object-id-param.dto';
import { TestDataFactory } from 'test/factories/test-data.factory';
import { UpdateLessonProductsDto } from './dto/update-lesson-products.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';

describe('LessonsController', () => {
  let controller: LessonsController;

  const mockLesson = TestDataFactory.createLesson();
  const mockLessonId = new Types.ObjectId();
  const mockInvalidLessonId = new Types.ObjectId();
  const mockProductId = new Types.ObjectId();

  const mockLessonResponse = {
    ...mockLesson,
    id: mockLessonId,
  };

  const mockLessonsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateProducts: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LessonsController],
      providers: [
        {
          provide: LessonsService,
          useValue: mockLessonsService,
        },
      ],
    }).compile();

    controller = module.get<LessonsController>(LessonsController);
  });

  describe('create', () => {
    it('should create a lesson and return id + message', async () => {
      mockLessonsService.create.mockResolvedValue(mockLessonResponse as any);

      const result = await controller.create(mockLesson);

      expect(mockLessonsService.create).toHaveBeenCalledWith(mockLesson);
      expect(result).toEqual({
        id: mockLessonId,
        message: 'Lesson created successfully',
      });
    });
  });

  describe('findAll', () => {
    it('should return all lessons', async () => {
      mockLessonsService.findAll.mockResolvedValue([mockLessonResponse]);

      const result = await controller.findAll();

      expect(mockLessonsService.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockLessonResponse]);
    });
  });

  describe('findOne', () => {
    it('should return lesson by id', async () => {
      mockLessonsService.findOne.mockResolvedValue(mockLessonResponse);

      const params: ObjectIdParamDto = { id: mockLessonId };
      const result = await controller.findOne(params);

      expect(mockLessonsService.findOne).toHaveBeenCalledWith(mockLessonId);
      expect(result).toEqual(mockLessonResponse);
    });

    it('should throw NotFoundException if lesson not found', async () => {
      mockLessonsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(
        controller.findOne({ id: mockInvalidLessonId }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update lesson and return id + message', async () => {
      mockLessonsService.update.mockResolvedValue(mockLessonResponse);

      const params: ObjectIdParamDto = { id: mockLessonId };
      const dto: UpdateLessonDto = { title: 'Updated Lesson' };

      const result = await controller.update(params, dto);

      expect(mockLessonsService.update).toHaveBeenCalledWith(mockLessonId, dto);
      expect(result).toEqual({
        id: mockLessonId,
        message: 'Lesson updated successfully',
      });
    });
  });

  describe('updateProducts', () => {
    it('should update products and return id + message', async () => {
      mockLessonsService.updateProducts.mockResolvedValue(mockLessonResponse);

      const params: ObjectIdParamDto = { id: mockLessonId };
      const dto: UpdateLessonProductsDto = { productIds: [mockProductId] };

      const result = await controller.updateProducts(params, dto);

      expect(mockLessonsService.updateProducts).toHaveBeenCalledWith(
        mockLessonId,
        dto,
      );
      expect(result).toEqual({
        id: mockLessonId,
        message: 'Lesson products updated successfully',
      });
    });
  });

  describe('remove', () => {
    it('should delete lesson and return id + message', async () => {
      mockLessonsService.remove.mockResolvedValue(mockLessonResponse);

      const params: ObjectIdParamDto = { id: mockLessonId };
      const result = await controller.remove(params);

      expect(mockLessonsService.remove).toHaveBeenCalledWith(mockLessonId);
      expect(result).toEqual({
        id: mockLessonId,
        message: 'Lesson deleted successfully',
      });
    });
  });
});
