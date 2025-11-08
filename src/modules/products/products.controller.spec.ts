import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';

import { MongoIdParamDto } from 'src/common/dto/mongo-id-param.dto';
import { TestDataFactory } from 'test/factories/test-data.factory';
import { makeObjectId } from 'test/helpers/make-object-id.helper';
import { LessonsService } from '../lessons/lessons.service';
import { StagesService } from '../stages/stages.service';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStoreLinksDto } from './dto/update-store-links.dto';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;

  const mockAuthorId = makeObjectId();
  const mockBrandId = makeObjectId();
  const mockCategoryId = makeObjectId();
  const mockProductId = makeObjectId();
  const mockBadProductId = makeObjectId();

  const mockProduct = TestDataFactory.createProduct(
    mockAuthorId,
    mockBrandId,
    mockCategoryId,
  );

  const mockProductResponse = {
    ...mockProduct,
    id: mockProductId,
  };

  const mockReq = { user: { id: mockProduct.authorId } } as Request;

  const mockProductsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByCategory: jest.fn(),
    findAllByAuthorAndCategory: jest.fn(),
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

      const result = await controller.create(mockReq, mockProduct);

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

      const params: MongoIdParamDto = { id: mockProductId };
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
      mockProductsService.findAllByAuthorAndCategory.mockResolvedValue(
        mockProducts,
      );

      const result = await controller.findAllByAuthorAndCategory(
        mockReq,
        'makeup',
      );

      expect(
        mockProductsService.findAllByAuthorAndCategory,
      ).toHaveBeenCalledWith(mockReq.user?.id, 'makeup');
      expect(result).toEqual(mockProducts);
    });

    it('should throw NotFoundException if category not found', async () => {
      mockProductsService.findAllByAuthorAndCategory.mockRejectedValue(
        new NotFoundException(),
      );

      await expect(
        controller.findAllByAuthorAndCategory(mockReq, 'invalid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a product and return id + message', async () => {
      mockProductsService.update.mockResolvedValue(mockProductResponse);

      const params: MongoIdParamDto = { id: mockProductId };
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

      const params: MongoIdParamDto = { id: mockProductId };
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

      const params: MongoIdParamDto = { id: mockProductId };
      const result = await controller.remove(params);

      expect(mockProductsService.remove).toHaveBeenCalledWith(mockProductId);
      expect(result).toEqual({ id: mockProductId });
    });
  });
});
