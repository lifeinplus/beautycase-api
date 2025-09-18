import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { MongoIdParamDto } from 'src/common/dto/mongo-id-param.dto';
import { TestDataFactory } from 'test/factories/test-data.factory';
import { UpdateStoreLinksDto } from './dto/update-store-links.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import { ToolsController } from './tools.controller';
import { ToolsService } from './tools.service';

describe('ToolsController', () => {
  let controller: ToolsController;

  const mockBrandId = new Types.ObjectId();
  const mockTool = TestDataFactory.createTool(mockBrandId);

  const mockToolResponse = {
    ...mockTool,
    id: 'tool-id',
  };

  const mockToolsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateStoreLinks: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ToolsController],
      providers: [
        {
          provide: ToolsService,
          useValue: mockToolsService,
        },
      ],
    }).compile();

    controller = module.get<ToolsController>(ToolsController);
  });

  describe('create', () => {
    it('should create a tool and return id + message', async () => {
      mockToolsService.create.mockResolvedValue(mockToolResponse as any);

      const result = await controller.create(mockTool);

      expect(mockToolsService.create).toHaveBeenCalledWith(mockTool);
      expect(result).toEqual({
        id: 'tool-id',
        message: 'Tool created successfully',
      });
    });
  });

  describe('findAll', () => {
    it('should return all tools', async () => {
      mockToolsService.findAll.mockResolvedValue([mockToolResponse]);

      const result = await controller.findAll();

      expect(mockToolsService.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockToolResponse]);
    });
  });

  describe('findOne', () => {
    it('should return tool by id', async () => {
      mockToolsService.findOne.mockResolvedValue(mockToolResponse);

      const params: MongoIdParamDto = { id: 'tool-id' };
      const result = await controller.findOne(params);

      expect(mockToolsService.findOne).toHaveBeenCalledWith('tool-id');
      expect(result).toEqual(mockToolResponse);
    });

    it('should throw NotFoundException if not found', async () => {
      mockToolsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne({ id: 'bad-id' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a tool and return id + message', async () => {
      mockToolsService.update.mockResolvedValue(mockToolResponse);

      const params: MongoIdParamDto = { id: 'tool-id' };
      const dto: UpdateToolDto = { name: 'Updated Brush' };

      const result = await controller.update(params, dto);

      expect(mockToolsService.update).toHaveBeenCalledWith('tool-id', dto);
      expect(result).toEqual({
        id: 'tool-id',
        message: 'Tool updated successfully',
      });
    });
  });

  describe('updateStoreLinks', () => {
    it('should update store links and return id + message', async () => {
      mockToolsService.updateStoreLinks.mockResolvedValue(mockToolResponse);

      const params: MongoIdParamDto = { id: 'tool-id' };
      const dto: UpdateStoreLinksDto = { storeLinks: [] };

      const result = await controller.updateStoreLinks(params, dto);

      expect(mockToolsService.updateStoreLinks).toHaveBeenCalledWith(
        'tool-id',
        dto,
      );
      expect(result).toEqual({
        id: 'tool-id',
        message: 'Tool store links updated successfully',
      });
    });
  });

  describe('remove', () => {
    it('should delete a tool and return id + message', async () => {
      mockToolsService.remove.mockResolvedValue(mockToolResponse);

      const params: MongoIdParamDto = { id: 'tool-id' };
      const result = await controller.remove(params);

      expect(mockToolsService.remove).toHaveBeenCalledWith('tool-id');
      expect(result).toEqual({
        id: 'tool-id',
        message: 'Tool deleted successfully',
      });
    });
  });
});
