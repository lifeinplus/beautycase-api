import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { MongoIdParamDto } from 'src/common/dto/mongo-id-param.dto';
import { TestDataFactory } from 'test/factories/test-data.factory';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStoreLinksDto } from './dto/update-store-links.dto';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;

  const mockBrandId = new Types.ObjectId();
  const mockCategoryId = new Types.ObjectId();

  const mockProduct = TestDataFactory.createProduct(
    mockBrandId,
    mockCategoryId,
  );

  const mockProductResponse = {
    ...mockProduct,
    id: 'product-id',
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
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  describe('create', () => {
    it('should create a product and return id + message', async () => {
      mockProductsService.create.mockResolvedValue(mockProductResponse as any);

      const result = await controller.create(mockProduct);

      expect(mockProductsService.create).toHaveBeenCalledWith(mockProduct);
      expect(result).toEqual({
        id: 'product-id',
        message: 'Product created successfully',
      });
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

      const params: MongoIdParamDto = { id: 'product-id' };
      const result = await controller.findOne(params);

      expect(mockProductsService.findOne).toHaveBeenCalledWith('product-id');
      expect(result).toEqual(mockProductResponse);
    });

    it('should throw NotFoundException if not found', async () => {
      mockProductsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne({ id: 'invalid-id' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByCategory', () => {
    it('should return products by category name', async () => {
      const mockProducts = [mockProductResponse];
      mockProductsService.findByCategory.mockResolvedValue(mockProducts);

      const result = await controller.findByCategory('makeup');

      expect(mockProductsService.findByCategory).toHaveBeenCalledWith('makeup');
      expect(result).toEqual(mockProducts);
    });

    it('should throw NotFoundException if category not found', async () => {
      mockProductsService.findByCategory.mockRejectedValue(
        new NotFoundException(),
      );

      await expect(controller.findByCategory('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a product and return id + message', async () => {
      mockProductsService.update.mockResolvedValue(mockProductResponse);

      const params: MongoIdParamDto = { id: 'product-id' };
      const dto: UpdateProductDto = { name: 'Updated Lipstick' };

      const result = await controller.update(params, dto);

      expect(mockProductsService.update).toHaveBeenCalledWith(
        'product-id',
        dto,
      );
      expect(result).toEqual({
        id: 'product-id',
        message: 'Product updated successfully',
      });
    });
  });

  describe('updateStoreLinks', () => {
    it('should update store links and return id + message', async () => {
      mockProductsService.updateStoreLinks.mockResolvedValue(
        mockProductResponse,
      );

      const params: MongoIdParamDto = { id: 'product-id' };
      const dto: UpdateStoreLinksDto = { storeLinks: [] };

      const result = await controller.updateStoreLinks(params, dto);

      expect(mockProductsService.updateStoreLinks).toHaveBeenCalledWith(
        'product-id',
        dto,
      );
      expect(result).toEqual({
        id: 'product-id',
        message: 'Product store links updated successfully',
      });
    });
  });

  describe('remove', () => {
    it('should delete a product and return id + message', async () => {
      mockProductsService.remove.mockResolvedValue(mockProductResponse);

      const params: MongoIdParamDto = { id: 'product-id' };
      const result = await controller.remove(params);

      expect(mockProductsService.remove).toHaveBeenCalledWith('product-id');
      expect(result).toEqual({
        id: 'product-id',
        message: 'Product deleted successfully',
      });
    });
  });
});
