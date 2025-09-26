import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Types } from 'mongoose';

import { NotFoundException } from '@nestjs/common';
import { UploadFolder } from 'src/common/enums/upload-folder.enum';
import { TestDataFactory } from 'test/factories/test-data.factory';
import { ImageService } from '../shared/image.service';
import { QuestionnairesService } from './questionnaires.service';
import { Questionnaire } from './schemas/questionnaire.schema';

type MockModel<T = any> = Partial<Record<keyof Model<T>, jest.Mock>> & {
  new (doc?: any): { save: jest.Mock };
};

describe('QuestionnairesService', () => {
  let service: QuestionnairesService;
  let mockQuestionnaireModel: MockModel;
  let imageService: jest.Mocked<ImageService>;

  const mockQuestionnaire = TestDataFactory.createQuestionnaire();
  const mockQuestionnaireId = new Types.ObjectId();
  const mockInvalidQuestionnaireId = new Types.ObjectId();

  const mockQuestionnaireResponse = {
    ...mockQuestionnaire,
    _id: mockQuestionnaireId,
    save: jest.fn(),
  };

  beforeEach(async () => {
    mockQuestionnaireModel = jest.fn(() => ({
      ...mockQuestionnaireResponse,
      save: jest.fn().mockResolvedValue(mockQuestionnaireResponse),
    })) as any;

    mockQuestionnaireModel.find = jest.fn();
    mockQuestionnaireModel.findById = jest.fn();

    imageService = {
      handleImageUpload: jest.fn(),
      handleImageUpdate: jest.fn(),
      handleImageDeletion: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionnairesService,
        {
          provide: getModelToken(Questionnaire.name),
          useValue: mockQuestionnaireModel,
        },
        { provide: ImageService, useValue: imageService },
      ],
    }).compile();

    service = module.get<QuestionnairesService>(QuestionnairesService);
  });

  describe('create', () => {
    it('should create a questionnaire without image upload', async () => {
      const result = await service.create({
        ...mockQuestionnaire,
        makeupBagPhotoUrl: undefined,
      });

      expect(imageService.handleImageUpload).not.toHaveBeenCalled();
      expect(result).toEqual(mockQuestionnaireResponse);
    });

    it('should create a questionnaire and upload image if makeupBagPhotoUrl provided', async () => {
      await service.create(mockQuestionnaire as any);

      expect(imageService.handleImageUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          imageId: undefined,
          imageUrl: 'https://example.com/photo.jpg',
        }),
        {
          filename: 'makeup-bag',
          folder: `${UploadFolder.QUESTIONNAIRES}/${mockQuestionnaireResponse._id}`,
          secureUrl: 'https://example.com/photo.jpg',
        },
      );
    });
  });

  describe('findAll', () => {
    it('should return all questionnaires', async () => {
      (mockQuestionnaireModel.find as jest.Mock).mockResolvedValue([
        mockQuestionnaireResponse,
      ]);

      const result = await service.findAll();
      expect(result).toEqual([mockQuestionnaireResponse]);
    });

    it('should throw NotFoundException if no questionnaires found', async () => {
      (mockQuestionnaireModel.find as jest.Mock).mockResolvedValue([]);

      await expect(service.findAll()).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return a questionnaire by id', async () => {
      (mockQuestionnaireModel.findById as jest.Mock).mockResolvedValue(
        mockQuestionnaireResponse,
      );

      const result = await service.findOne(mockQuestionnaireId);
      expect(result).toEqual(mockQuestionnaireResponse);
    });

    it('should throw NotFoundException if questionnaire not found', async () => {
      (mockQuestionnaireModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(mockInvalidQuestionnaireId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
