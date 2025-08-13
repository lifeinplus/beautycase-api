import { Test, TestingModule } from '@nestjs/testing';

import { NotFoundException } from '@nestjs/common';
import { MongoIdParamDto } from 'src/common/dto/mongo-id-param.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStoreLinksDto } from './dto/update-store-links.dto';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;

  const mockProduct = {
    id: 'product-id',
    brandId: 'brand-id',
    name: 'Lipstick',
    imageUrl: 'http://example.com/image.jpg',
    comment: 'Nice product',
    storeLinks: [],
  };

  const mockProductsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
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

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a product and return id + message', async () => {
      mockProductsService.create.mockResolvedValue(mockProduct as any);

      const dto: CreateProductDto = {
        brandId: 'brand-id',
        name: 'Lipstick',
        imageUrl: 'http://example.com/image.jpg',
        comment: 'Nice product',
        storeLinks: [],
      };

      const result = await controller.create(dto);

      expect(mockProductsService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        id: 'product-id',
        message: 'Product created successfully',
      });
    });
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      mockProductsService.findAll.mockResolvedValue([mockProduct]);

      const result = await controller.findAll();

      expect(mockProductsService.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockProduct]);
    });
  });

  describe('findOne', () => {
    it('should return product by id', async () => {
      mockProductsService.findOne.mockResolvedValue(mockProduct);

      const params: MongoIdParamDto = { id: 'product-id' };
      const result = await controller.findOne(params);

      expect(mockProductsService.findOne).toHaveBeenCalledWith('product-id');
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException if not found', async () => {
      mockProductsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne({ id: 'invalid-id' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a product and return id + message', async () => {
      mockProductsService.update.mockResolvedValue(mockProduct);

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
      mockProductsService.updateStoreLinks.mockResolvedValue(mockProduct);

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
      mockProductsService.remove.mockResolvedValue(mockProduct);

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
