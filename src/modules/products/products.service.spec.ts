import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';

import { UploadFolder } from 'src/common/enums/upload-folder.enum';
import { TestDataFactory } from 'test/factories/test-data.factory';
import { makeObjectId } from 'test/helpers/make-object-id.helper';
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
    imageIds: ['products/image1', 'products/image2'],
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
    cloneImage: jest.fn().mockResolvedValue('mocked-image-id'),
    uploadImage: jest.fn().mockResolvedValue('mocked-image-id'),
    deleteImage: jest.fn().mockResolvedValue(undefined),
    deleteFolder: jest.fn().mockResolvedValue(undefined),
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

      expect(mockImageService.uploadImage).toHaveBeenCalledWith(
        mockProduct.imageIds[0],
        `${UploadFolder.PRODUCTS}/${mockProductResponse.id}`,
      );

      expect(result.id).toBe(mockProductResponse.id);
      expect(result.name).toBe(mockProductResponse.name);
      expect(result.imageIds).toBe(mockProductResponse.imageIds);
    });
  });

  describe('duplicate', () => {
    it('should duplicate a product', async () => {
      jest.mocked(mockProductModel.findById as jest.Mock).mockResolvedValue({
        toObject: () => mockProductResponse,
        name: mockProductResponse.name,
        imageIds: mockProductResponse.imageIds,
      });

      const saveMock = jest.fn().mockResolvedValue(mockProductResponse);

      jest.mocked(mockProductModel).mockImplementation((doc) => ({
        ...doc,
        id: mockProductId,
        save: saveMock,
      }));

      const result = await service.duplicate(mockProductId);

      expect(mockProductModel.findById).toHaveBeenCalledWith(mockProductId);
      expect(result.imageIds).toEqual(['mocked-image-id', 'mocked-image-id']);
      expect(result.name).toBe(`${mockProductResponse.name} (Копия)`);
      expect(saveMock).toHaveBeenCalledTimes(2);
    });

    it('should throw NotFoundException if not found', async () => {
      (mockProductModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.duplicate(mockBadProductId)).rejects.toThrow(
        NotFoundException,
      );
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

      const result = await service.findAllByAuthorAndCategory(
        mockAuthorId,
        'makeup',
      );

      expect(
        (service as any).categoriesService.findByName,
      ).toHaveBeenCalledWith('makeup');
      expect(mockProductModel.find).toHaveBeenCalledWith({
        authorId: mockAuthorId,
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

      await expect(
        service.findAllByAuthorAndCategory(mockAuthorId, 'makeup'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update product and handle image if provided', async () => {
      jest
        .mocked(mockProductModel.findByIdAndUpdate as jest.Mock)
        .mockResolvedValue(mockProductResponse);

      const dto: UpdateProductDto = { imageIds: ['products/image'] };
      const result = await service.update(mockProductId, dto);

      expect(mockImageService.uploadImage).toHaveBeenCalledWith(
        'products/image',
        `${UploadFolder.PRODUCTS}/${mockProductResponse.id}`,
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
    it('should delete a product', async () => {
      (mockProductModel.findByIdAndDelete as jest.Mock).mockResolvedValue(
        mockProductResponse,
      );

      const result = await service.remove(mockProductId);
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
