import { Test, TestingModule } from '@nestjs/testing';

import { NotFoundException } from '@nestjs/common';
import { MongoIdParamDto } from 'src/common/dto/mongo-id-param.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonProductsDto } from './dto/update-lesson-products.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';

describe('LessonsController', () => {
  let controller: LessonsController;

  const mockLesson = {
    id: 'lesson-id',
    title: 'Makeup Basics',
    shortDescription: 'Learn the basics',
    videoUrl: 'http://example.com/video.mp4',
    fullDescription: 'Full lesson content',
    productIds: [],
    clientIds: [],
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

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a lesson and return id + message', async () => {
      const dto: CreateLessonDto = {
        title: 'Makeup Basics',
        shortDescription: 'Learn the basics',
        videoUrl: 'http://example.com/video.mp4',
        fullDescription: 'Full lesson content',
      } as any;

      mockLessonsService.create.mockResolvedValue(mockLesson as any);

      const result = await controller.create(dto);

      expect(mockLessonsService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        id: 'lesson-id',
        message: 'Lesson created successfully',
      });
    });
  });

  describe('findAll', () => {
    it('should return all lessons', async () => {
      mockLessonsService.findAll.mockResolvedValue([mockLesson]);

      const result = await controller.findAll();

      expect(mockLessonsService.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockLesson]);
    });
  });

  describe('findOne', () => {
    it('should return lesson by id', async () => {
      mockLessonsService.findOne.mockResolvedValue(mockLesson);

      const params: MongoIdParamDto = { id: 'lesson-id' };
      const result = await controller.findOne(params);

      expect(mockLessonsService.findOne).toHaveBeenCalledWith('lesson-id');
      expect(result).toEqual(mockLesson);
    });

    it('should throw NotFoundException if lesson not found', async () => {
      mockLessonsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne({ id: 'invalid-id' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update lesson and return id + message', async () => {
      mockLessonsService.update.mockResolvedValue(mockLesson);

      const params: MongoIdParamDto = { id: 'lesson-id' };
      const dto: UpdateLessonDto = { title: 'Updated Lesson' };

      const result = await controller.update(params, dto);

      expect(mockLessonsService.update).toHaveBeenCalledWith('lesson-id', dto);
      expect(result).toEqual({
        id: 'lesson-id',
        message: 'Lesson updated successfully',
      });
    });
  });

  describe('updateProducts', () => {
    it('should update products and return id + message', async () => {
      mockLessonsService.updateProducts.mockResolvedValue(mockLesson);

      const params: MongoIdParamDto = { id: 'lesson-id' };
      const dto: UpdateLessonProductsDto = { productIds: ['p1', 'p2'] };

      const result = await controller.updateProducts(params, dto);

      expect(mockLessonsService.updateProducts).toHaveBeenCalledWith(
        'lesson-id',
        dto,
      );
      expect(result).toEqual({
        id: 'lesson-id',
        message: 'Lesson products updated successfully',
      });
    });
  });

  describe('remove', () => {
    it('should delete lesson and return id + message', async () => {
      mockLessonsService.remove.mockResolvedValue(mockLesson);

      const params: MongoIdParamDto = { id: 'lesson-id' };
      const result = await controller.remove(params);

      expect(mockLessonsService.remove).toHaveBeenCalledWith('lesson-id');
      expect(result).toEqual({
        id: 'lesson-id',
        message: 'Lesson deleted successfully',
      });
    });
  });
});
