import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { ObjectIdParamDto } from 'src/common/dto/object-id-param.dto';
import { TestDataFactory } from 'test/factories/test-data.factory';
import { LessonsService } from '../lessons/lessons.service';
import { StagesService } from '../stages/stages.service';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStoreLinksDto } from './dto/update-store-links.dto';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;

  const mockBrandId = new Types.ObjectId();
  const mockCategoryId = new Types.ObjectId();
  const mockProductId = new Types.ObjectId();
  const mockBadProductId = new Types.ObjectId();

  const mockProduct = TestDataFactory.createProduct(
    mockBrandId,
    mockCategoryId,
  );

  const mockProductResponse = {
    ...mockProduct,
    id: mockProductId,
  };

  const mockProductsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByCategory: jest.fn(),
    update: jest.fn(),
    updateStoreLinks: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
        {
          provide: LessonsService,
          useValue: {},
        },
        {
          provide: StagesService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  describe('create', () => {
    it('should create a product and return id + message', async () => {
      mockProductsService.create.mockResolvedValue(mockProductResponse as any);

      const result = await controller.create(mockProduct);

      expect(mockProductsService.create).toHaveBeenCalledWith(mockProduct);
      expect(result).toEqual({ id: mockProductId });
    });
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      mockProductsService.findAll.mockResolvedValue([mockProductResponse]);

      const result = await controller.findAll();

      expect(mockProductsService.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockProductResponse]);
    });
  });

  describe('findOne', () => {
    it('should return product by id', async () => {
      mockProductsService.findOne.mockResolvedValue(mockProductResponse);

      const params: ObjectIdParamDto = { id: mockProductId };
      const result = await controller.findOne(params);

      expect(mockProductsService.findOne).toHaveBeenCalledWith(mockProductId);
      expect(result).toEqual(mockProductResponse);
    });

    it('should throw NotFoundException if not found', async () => {
      mockProductsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(
        controller.findOne({ id: mockBadProductId }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCategory', () => {
    it('should return products by category name', async () => {
      const mockProducts = [mockProductResponse];
      mockProductsService.findByCategory.mockResolvedValue(mockProducts);

      const result = await controller.findAllByCategory('makeup');

      expect(mockProductsService.findByCategory).toHaveBeenCalledWith('makeup');
      expect(result).toEqual(mockProducts);
    });

    it('should throw NotFoundException if category not found', async () => {
      mockProductsService.findByCategory.mockRejectedValue(
        new NotFoundException(),
      );

      await expect(controller.findAllByCategory('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a product and return id + message', async () => {
      mockProductsService.update.mockResolvedValue(mockProductResponse);

      const params: ObjectIdParamDto = { id: mockProductId };
      const dto: UpdateProductDto = { name: 'Updated Lipstick' };

      const result = await controller.update(params, dto);

      expect(mockProductsService.update).toHaveBeenCalledWith(
        mockProductId,
        dto,
      );
      expect(result).toEqual({ id: mockProductId });
    });
  });

  describe('updateStoreLinks', () => {
    it('should update store links and return id + message', async () => {
      mockProductsService.updateStoreLinks.mockResolvedValue(
        mockProductResponse,
      );

      const params: ObjectIdParamDto = { id: mockProductId };
      const dto: UpdateStoreLinksDto = { storeLinks: [] };

      const result = await controller.updateStoreLinks(params, dto);

      expect(mockProductsService.updateStoreLinks).toHaveBeenCalledWith(
        mockProductId,
        dto,
      );
      expect(result).toEqual({ id: mockProductId });
    });
  });

  describe('remove', () => {
    it('should delete a product and return id + message', async () => {
      mockProductsService.remove.mockResolvedValue(mockProductResponse);

      const params: ObjectIdParamDto = { id: mockProductId };
      const result = await controller.remove(params);

      expect(mockProductsService.remove).toHaveBeenCalledWith(mockProductId);
      expect(result).toEqual({ id: mockProductId });
    });
  });
});
