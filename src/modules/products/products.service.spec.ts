import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';

import { UploadFolder } from 'src/common/enums/upload-folder.enum';
import { TestDataFactory } from 'test/factories/test-data.factory';
import { ImageService } from '../shared/image.service';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStoreLinksDto } from './dto/update-store-links.dto';
import { ProductsService } from './products.service';
import { Product, ProductDocument } from './schemas/product.schema';

type MockModel<T = any> = Partial<Record<keyof Model<T>, jest.Mock>> & {
  new (doc?: any): { save: jest.Mock };
};

describe('ProductsService', () => {
  let service: ProductsService;
  let mockProductModel: MockModel<ProductDocument>;

  const mockProduct = TestDataFactory.createProduct('brand-id');

  const mockProductResponse = {
    ...mockProduct,
    _id: 'product-id',
    imageId: 'image-id',
    save: jest.fn(),
  };

  mockProductModel = jest.fn(() => ({
    ...mockProductResponse,
    save: jest.fn().mockResolvedValue(mockProductResponse),
  }));

  mockProductModel.find = jest.fn();
  mockProductModel.findById = jest.fn();
  mockProductModel.findByIdAndUpdate = jest.fn();
  mockProductModel.findByIdAndDelete = jest.fn();

  const mockImageService = {
    handleImageUpload: jest.fn(),
    handleImageUpdate: jest.fn(),
    handleImageDeletion: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getModelToken(Product.name),
          useValue: mockProductModel,
        },
        {
          provide: ImageService,
          useValue: mockImageService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  describe('create', () => {
    it('should create a product and upload image', async () => {
      const result = await service.create(mockProduct);

      expect(mockImageService.handleImageUpload).toHaveBeenCalledWith(
        expect.objectContaining({ _id: 'product-id' }),
        { folder: UploadFolder.PRODUCTS, secureUrl: mockProduct.imageUrl },
      );
      expect(result._id).toBe(mockProductResponse._id);
      expect(result.name).toBe(mockProductResponse.name);
      expect(result.imageUrl).toBe(mockProductResponse.imageUrl);
    });
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      (mockProductModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue([mockProductResponse]),
      });

      const result = await service.findAll();
      expect(result).toEqual([mockProductResponse]);
    });

    it('should throw NotFoundException if no products found', async () => {
      (mockProductModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });

      await expect(service.findAll()).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return product by id', async () => {
      (mockProductModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProductResponse),
      });

      const result = await service.findOne('product-id');
      expect(result).toEqual(mockProductResponse);
    });

    it('should throw NotFoundException if product not found', async () => {
      (mockProductModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update product and handle image if provided', async () => {
      (mockProductModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(
        mockProductResponse,
      );

      const dto: UpdateProductDto = { imageUrl: 'http://example.com/new.jpg' };
      const result = await service.update('product-id', dto);

      expect(mockImageService.handleImageUpdate).toHaveBeenCalledWith(
        mockProductResponse,
        {
          folder: UploadFolder.PRODUCTS,
          secureUrl: dto.imageUrl,
        },
      );
      expect(result).toEqual(mockProductResponse);
    });

    it('should throw NotFoundException if product not found', async () => {
      (mockProductModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await expect(service.update('bad-id', {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStoreLinks', () => {
    it('should update store links', async () => {
      (mockProductModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(
        mockProductResponse,
      );

      const dto: UpdateStoreLinksDto = { storeLinks: [] };
      const result = await service.updateStoreLinks('product-id', dto);

      expect(result).toEqual(mockProductResponse);
    });

    it('should throw NotFoundException if product not found', async () => {
      (mockProductModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateStoreLinks('bad-id', { storeLinks: [] }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete product and remove image if exists', async () => {
      (mockProductModel.findByIdAndDelete as jest.Mock).mockResolvedValue(
        mockProductResponse,
      );

      const result = await service.remove('product-id');

      expect(mockImageService.handleImageDeletion).toHaveBeenCalledWith(
        mockProductResponse.imageId,
      );
      expect(result).toEqual(mockProductResponse);
    });

    it('should throw NotFoundException if product not found', async () => {
      (mockProductModel.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
