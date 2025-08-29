import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { TestDataFactory } from 'test/factories/test-data.factory';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Store } from './schemas/store.schema';
import { StoresService } from './stores.service';

describe('StoresService', () => {
  let service: StoresService;

  const mockStore = TestDataFactory.createStore();
  const mockStores = TestDataFactory.createMultipleStores(2);

  const mockStoreResponse = {
    ...mockStore,
    _id: '507f1f77bcf86cd799439011',
  };

  const mockStoreModel = {
    create: jest.fn(),
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoresService,
        {
          provide: getModelToken(Store.name),
          useValue: mockStoreModel,
        },
      ],
    }).compile();

    service = module.get<StoresService>(StoresService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create a store', async () => {
      mockStoreModel.create.mockResolvedValue(mockStoreResponse);

      const result = await service.create(mockStore);

      expect(mockStoreModel.create).toHaveBeenCalledWith(mockStore);
      expect(result).toEqual(mockStoreResponse);
    });

    it('should handle creation errors', async () => {
      const error = new Error('Database error');
      mockStoreModel.create.mockRejectedValue(error);

      await expect(service.create(mockStore)).rejects.toThrow(error);
      expect(mockStoreModel.create).toHaveBeenCalledWith(mockStore);
    });
  });

  describe('findAll', () => {
    it('should return all stores sorted by name', async () => {
      const mockQuery = {
        sort: jest.fn().mockResolvedValue(mockStores),
      };

      mockStoreModel.find.mockReturnValue(mockQuery);

      const result = await service.findAll();

      expect(mockStoreModel.find).toHaveBeenCalledWith();
      expect(mockQuery.sort).toHaveBeenCalledWith('name');
      expect(result).toEqual(mockStores);
    });

    it('should throw NotFoundException when no stores found', async () => {
      const mockQuery = {
        sort: jest.fn().mockResolvedValue([]),
      };

      mockStoreModel.find.mockReturnValue(mockQuery);

      await expect(service.findAll()).rejects.toThrow(
        new NotFoundException('Stores not found'),
      );

      expect(mockStoreModel.find).toHaveBeenCalledWith();
      expect(mockQuery.sort).toHaveBeenCalledWith('name');
    });
  });

  describe('update', () => {
    it('should successfully update a store', async () => {
      const storeId = '507f1f77bcf86cd799439011';
      const dto: UpdateStoreDto = {
        name: 'Updated Store',
      };

      const updatedStore = { ...mockStoreResponse, ...dto };
      mockStoreModel.findByIdAndUpdate.mockResolvedValue(updatedStore);

      const result = await service.update(storeId, dto);

      expect(mockStoreModel.findByIdAndUpdate).toHaveBeenCalledWith(
        storeId,
        dto,
        {
          new: true,
          runValidators: true,
        },
      );
      expect(result).toEqual(updatedStore);
    });

    it('should throw NotFoundException when store to update is not found', async () => {
      const storeId = '507f1f77bcf86cd799439011';
      const dto: UpdateStoreDto = {
        name: 'Updated Store',
      };

      mockStoreModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(service.update(storeId, dto)).rejects.toThrow(
        new NotFoundException('Store not found'),
      );

      expect(mockStoreModel.findByIdAndUpdate).toHaveBeenCalledWith(
        storeId,
        dto,
        {
          new: true,
          runValidators: true,
        },
      );
    });

    it('should handle update errors', async () => {
      const storeId = '507f1f77bcf86cd799439011';
      const dto: UpdateStoreDto = {
        name: 'Updated Store',
      };

      const error = new Error('Database error');
      mockStoreModel.findByIdAndUpdate.mockRejectedValue(error);

      await expect(service.update(storeId, dto)).rejects.toThrow(error);
    });
  });

  describe('remove', () => {
    it('should successfully remove a store', async () => {
      const storeId = '507f1f77bcf86cd799439011';

      mockStoreModel.findByIdAndDelete.mockResolvedValue(mockStoreResponse);

      const result = await service.remove(storeId);

      expect(mockStoreModel.findByIdAndDelete).toHaveBeenCalledWith(storeId);
      expect(result).toEqual(mockStoreResponse);
    });

    it('should throw NotFoundException when store to remove is not found', async () => {
      const storeId = '507f1f77bcf86cd799439011';

      mockStoreModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(service.remove(storeId)).rejects.toThrow(
        new NotFoundException('Store not found'),
      );

      expect(mockStoreModel.findByIdAndDelete).toHaveBeenCalledWith(storeId);
    });

    it('should handle removal errors', async () => {
      const storeId = '507f1f77bcf86cd799439011';

      const error = new Error('Database error');
      mockStoreModel.findByIdAndDelete.mockRejectedValue(error);

      await expect(service.remove(storeId)).rejects.toThrow(error);
    });
  });
});
