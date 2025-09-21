import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Types } from 'mongoose';

import { UploadFolder } from 'src/common/enums/upload-folder.enum';
import { TestDataFactory } from 'test/factories/test-data.factory';
import { CategoriesService } from '../categories/categories.service';
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
    _id: mockProductId,
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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getModelToken(Product.name),
          useValue: mockProductModel,
        },
        {
          provide: CategoriesService,
          useValue: {},
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
        expect.objectContaining({ _id: mockProductId }),
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

      const result = await service.findOne(mockProductId);
      expect(result).toEqual(mockProductResponse);
    });

    it('should throw NotFoundException if product not found', async () => {
      (mockProductModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne(mockBadProductId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByCategory', () => {
    it('should return products for a given category', async () => {
      const mockCategory = { _id: mockCategoryId, name: 'makeup' };
      const mockProducts = [mockProductResponse];

      (service as any).categoriesService.findByName = jest
        .fn()
        .mockResolvedValue(mockCategory);

      (mockProductModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockProducts),
      });

      const result = await service.findByCategory('makeup');

      expect(
        (service as any).categoriesService.findByName,
      ).toHaveBeenCalledWith('makeup');
      expect(mockProductModel.find).toHaveBeenCalledWith({
        categoryId: mockCategory._id,
      });
      expect(result).toEqual(mockProducts);
    });

    it('should throw NotFoundException if no products for category', async () => {
      const mockCategory = { id: 'category-id', name: 'makeup' };

      (service as any).categoriesService.findByName = jest
        .fn()
        .mockResolvedValue(mockCategory);

      (mockProductModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });

      await expect(service.findByCategory('makeup')).rejects.toThrow(
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
      const result = await service.update(mockProductId, dto);

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

      await expect(service.update(mockBadProductId, {} as any)).rejects.toThrow(
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
      const result = await service.updateStoreLinks(mockProductId, dto);

      expect(result).toEqual(mockProductResponse);
    });

    it('should throw NotFoundException if product not found', async () => {
      (mockProductModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateStoreLinks(mockBadProductId, { storeLinks: [] }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete product and remove image if exists', async () => {
      (mockProductModel.findByIdAndDelete as jest.Mock).mockResolvedValue(
        mockProductResponse,
      );

      const result = await service.remove(mockProductId);

      expect(mockImageService.handleImageDeletion).toHaveBeenCalledWith(
        mockProductResponse.imageId,
      );
      expect(result).toEqual(mockProductResponse);
    });

    it('should throw NotFoundException if product not found', async () => {
      (mockProductModel.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      await expect(service.remove(mockBadProductId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
