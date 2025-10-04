import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Types } from 'mongoose';

import { NotFoundException } from '@nestjs/common';
import { UploadFolder } from 'src/common/enums/upload-folder.enum';
import { TestDataFactory } from 'test/factories/test-data.factory';
import { ImageService } from '../shared/image.service';
import { QuestionnairesService } from './questionnaires.service';
import { MakeupBagQuestionnaire } from './schemas/makeup-bag-questionnaire.schema';
import { TrainingQuestionnaire } from './schemas/training-questionnaire.schema';

type MockModel<T = any> = Partial<Record<keyof Model<T>, jest.Mock>> & {
  new (doc?: any): { save: jest.Mock };
};

describe('QuestionnairesService', () => {
  let service: QuestionnairesService;
  let mockMakeupBagQuestionnaireModel: MockModel;
  let mockTrainingQuestionnaireModel: MockModel;
  let imageService: jest.Mocked<ImageService>;

  const mockMakeupBagQuestionnaire =
    TestDataFactory.createMakeupBagQuestionnaire();
  const mockMakeupBagQuestionnaireId = new Types.ObjectId();
  const mockInvalidMakeupBagQuestionnaireId = new Types.ObjectId();
  const mockMakeupBagQuestionnaireResponse = {
    ...mockMakeupBagQuestionnaire,
    _id: mockMakeupBagQuestionnaireId,
    save: jest.fn(),
  };

  const mockTrainingQuestionnaire =
    TestDataFactory.createTrainingQuestionnaire();
  const mockTrainingQuestionnaireId = new Types.ObjectId();
  const mockInvalidTrainingQuestionnaireId = new Types.ObjectId();
  const mockTrainingQuestionnaireResponse = {
    ...mockTrainingQuestionnaire,
    _id: mockTrainingQuestionnaireId,
    create: jest.fn(),
  };

  beforeEach(async () => {
    mockMakeupBagQuestionnaireModel = jest.fn(() => ({
      ...mockMakeupBagQuestionnaireResponse,
      save: jest.fn().mockResolvedValue(mockMakeupBagQuestionnaireResponse),
    })) as any;

    mockMakeupBagQuestionnaireModel.find = jest.fn();
    mockMakeupBagQuestionnaireModel.findById = jest.fn();

    mockTrainingQuestionnaireModel = jest.fn(() => ({
      ...mockTrainingQuestionnaireResponse,
      create: jest.fn().mockResolvedValue(mockTrainingQuestionnaireResponse),
    })) as any;

    mockTrainingQuestionnaireModel.create = jest
      .fn()
      .mockResolvedValue(mockTrainingQuestionnaireResponse);
    mockTrainingQuestionnaireModel.find = jest.fn();
    mockTrainingQuestionnaireModel.findById = jest.fn();

    imageService = {
      handleImageUpload: jest.fn(),
      handleImageUpdate: jest.fn(),
      handleImageDeletion: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionnairesService,
        {
          provide: getModelToken(MakeupBagQuestionnaire.name),
          useValue: mockMakeupBagQuestionnaireModel,
        },
        {
          provide: getModelToken(TrainingQuestionnaire.name),
          useValue: mockTrainingQuestionnaireModel,
        },
        { provide: ImageService, useValue: imageService },
      ],
    }).compile();

    service = module.get<QuestionnairesService>(QuestionnairesService);
  });

  describe('MakeupBag', () => {
    describe('createMakeupBag', () => {
      it('should create a questionnaire without image upload', async () => {
        const result = await service.createMakeupBag({
          ...mockMakeupBagQuestionnaire,
          makeupBagPhotoUrl: undefined,
        });

        expect(imageService.handleImageUpload).not.toHaveBeenCalled();
        expect(result).toEqual(mockMakeupBagQuestionnaireResponse);
      });

      it('should create a questionnaire and upload image if makeupBagPhotoUrl provided', async () => {
        await service.createMakeupBag(mockMakeupBagQuestionnaire as any);

        expect(imageService.handleImageUpload).toHaveBeenCalledWith(
          expect.objectContaining({
            imageId: undefined,
            imageUrl: 'https://example.com/photo.jpg',
          }),
          {
            filename: 'makeup-bag',
            folder: `${UploadFolder.QUESTIONNAIRES}/${mockMakeupBagQuestionnaireResponse._id}`,
            secureUrl: 'https://example.com/photo.jpg',
          },
        );
      });
    });

    describe('findAllMakeupBag', () => {
      it('should return all questionnaires', async () => {
        (mockMakeupBagQuestionnaireModel.find as jest.Mock).mockResolvedValue([
          mockMakeupBagQuestionnaireResponse,
        ]);

        const result = await service.findAllMakeupBags();
        expect(result).toEqual([mockMakeupBagQuestionnaireResponse]);
      });

      it('should throw NotFoundException if no questionnaires found', async () => {
        (mockMakeupBagQuestionnaireModel.find as jest.Mock).mockResolvedValue(
          [],
        );

        await expect(service.findAllMakeupBags()).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('findOneMakeupBag', () => {
      it('should return a questionnaire by id', async () => {
        (
          mockMakeupBagQuestionnaireModel.findById as jest.Mock
        ).mockResolvedValue(mockMakeupBagQuestionnaireResponse);

        const result = await service.findOneMakeupBag(
          mockMakeupBagQuestionnaireId,
        );
        expect(result).toEqual(mockMakeupBagQuestionnaireResponse);
      });

      it('should throw NotFoundException if questionnaire not found', async () => {
        (
          mockMakeupBagQuestionnaireModel.findById as jest.Mock
        ).mockResolvedValue(null);

        await expect(
          service.findOneMakeupBag(mockInvalidMakeupBagQuestionnaireId),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('Training', () => {
    describe('createTraining', () => {
      it('should create a questionnaire', async () => {
        const result = await service.createTraining(mockTrainingQuestionnaire);
        expect(result).toEqual(mockTrainingQuestionnaireResponse);
      });
    });

    describe('findAllTraining', () => {
      it('should return all questionnaires', async () => {
        (mockTrainingQuestionnaireModel.find as jest.Mock).mockResolvedValue([
          mockTrainingQuestionnaireResponse,
        ]);

        const result = await service.findAllTrainings();
        expect(result).toEqual([mockTrainingQuestionnaireResponse]);
      });

      it('should throw NotFoundException if no questionnaires found', async () => {
        (mockTrainingQuestionnaireModel.find as jest.Mock).mockResolvedValue(
          [],
        );

        await expect(service.findAllTrainings()).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('findOneTraining', () => {
      it('should return a questionnaire by id', async () => {
        (
          mockTrainingQuestionnaireModel.findById as jest.Mock
        ).mockResolvedValue(mockTrainingQuestionnaireResponse);

        const result = await service.findOneTraining(
          mockTrainingQuestionnaireId,
        );
        expect(result).toEqual(mockTrainingQuestionnaireResponse);
      });

      it('should throw NotFoundException if questionnaire not found', async () => {
        (
          mockTrainingQuestionnaireModel.findById as jest.Mock
        ).mockResolvedValue(null);

        await expect(
          service.findOneTraining(mockInvalidTrainingQuestionnaireId),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });
});
