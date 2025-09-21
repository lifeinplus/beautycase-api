import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ObjectIdParamDto } from 'src/common/dto/object-id-param.dto';
import { TestDataFactory } from 'test/factories/test-data.factory';
import { UpdateStageProductsDto } from './dto/update-stage-products.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { StagesController } from './stages.controller';
import { StagesService } from './stages.service';

describe('StagesController', () => {
  let controller: StagesController;

  const mockStage = TestDataFactory.createStage();

  const mockStageResponse = {
    ...mockStage,
    id: 'stage-id',
  };

  const mockStagesService = {
    create: jest.fn(),
    duplicate: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateProducts: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StagesController],
      providers: [
        {
          provide: StagesService,
          useValue: mockStagesService,
        },
      ],
    }).compile();

    controller = module.get<StagesController>(StagesController);
  });

  describe('create', () => {
    it('should create a stage and return id + message', async () => {
      mockStagesService.create.mockResolvedValue(mockStageResponse as any);

      const result = await controller.create(mockStage);

      expect(mockStagesService.create).toHaveBeenCalledWith(mockStage);
      expect(result).toEqual({
        id: 'stage-id',
        message: 'Stage created successfully',
      });
    });
  });

  describe('duplicate', () => {
    it('should duplicate a stage and return id + message', async () => {
      mockStagesService.duplicate.mockResolvedValue(mockStageResponse);

      const params: ObjectIdParamDto = { id: 'stage-id' };
      const result = await controller.duplicate(params);

      expect(mockStagesService.duplicate).toHaveBeenCalledWith('stage-id');
      expect(result).toEqual({
        id: 'stage-id',
        message: 'Stage duplicated successfully',
      });
    });
  });

  describe('findAll', () => {
    it('should return all stages', async () => {
      mockStagesService.findAll.mockResolvedValue([mockStageResponse]);

      const result = await controller.findAll();

      expect(mockStagesService.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockStageResponse]);
    });
  });

  describe('findOne', () => {
    it('should return a stage by id', async () => {
      mockStagesService.findOne.mockResolvedValue(mockStageResponse);

      const params: ObjectIdParamDto = { id: 'stage-id' };
      const result = await controller.findOne(params);

      expect(mockStagesService.findOne).toHaveBeenCalledWith('stage-id');
      expect(result).toEqual(mockStageResponse);
    });

    it('should throw NotFoundException if not found', async () => {
      mockStagesService.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne({ id: 'bad-id' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a stage and return id + message', async () => {
      mockStagesService.update.mockResolvedValue(mockStageResponse);

      const params: ObjectIdParamDto = { id: 'stage-id' };
      const dto: UpdateStageDto = { title: 'Updated title' };

      const result = await controller.update(params, dto);

      expect(mockStagesService.update).toHaveBeenCalledWith('stage-id', dto);
      expect(result).toEqual({
        id: 'stage-id',
        message: 'Stage updated successfully',
      });
    });
  });

  describe('updateProducts', () => {
    it('should update stage products and return id + message', async () => {
      mockStagesService.updateProducts.mockResolvedValue(mockStageResponse);

      const params: ObjectIdParamDto = { id: 'stage-id' };
      const dto: UpdateStageProductsDto = { productIds: ['p1', 'p2'] };

      const result = await controller.updateProducts(params, dto);

      expect(mockStagesService.updateProducts).toHaveBeenCalledWith(
        'stage-id',
        dto,
      );
      expect(result).toEqual({
        id: 'stage-id',
        message: 'Stage products updated successfully',
      });
    });
  });

  describe('remove', () => {
    it('should delete a stage and return id + message', async () => {
      mockStagesService.remove.mockResolvedValue(mockStageResponse);

      const params: ObjectIdParamDto = { id: 'stage-id' };
      const result = await controller.remove(params);

      expect(mockStagesService.remove).toHaveBeenCalledWith('stage-id');
      expect(result).toEqual({
        id: 'stage-id',
        message: 'Stage deleted successfully',
      });
    });
  });
});
