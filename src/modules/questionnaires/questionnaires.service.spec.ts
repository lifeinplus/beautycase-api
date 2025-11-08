import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';

import { UploadFolder } from 'src/common/enums/upload-folder.enum';
import { TestDataFactory } from 'test/factories/test-data.factory';
import { makeObjectId } from 'test/helpers/make-object-id.helper';
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

  const mockMuaId = makeObjectId();
  const mockMakeupBagQuestionnaireId = makeObjectId();
  const mockBadMakeupBagQuestionnaireId = makeObjectId();
  const mockTrainingQuestionnaireId = makeObjectId();
  const mockBadTrainingQuestionnaireId = makeObjectId();

  const mockMakeupBagQuestionnaire =
    TestDataFactory.createMakeupBagQuestionnaire(mockMuaId);
  const mockMakeupBagQuestionnaireResponse = {
    ...mockMakeupBagQuestionnaire,
    _id: mockMakeupBagQuestionnaireId,
    makeupBagPhotoId: 'img-id',
    save: jest.fn(),
  };

  const mockTrainingQuestionnaire =
    TestDataFactory.createTrainingQuestionnaire(mockMuaId);
  const mockTrainingQuestionnaireResponse = {
    ...mockTrainingQuestionnaire,
    _id: mockTrainingQuestionnaireId,
    create: jest.fn(),
  };

  const mockImageService = {
    handleImageUpload: jest.fn(),
    handleImageUpdate: jest.fn(),
    handleImageDeletion: jest.fn(),
  } as any;

  beforeEach(async () => {
    mockMakeupBagQuestionnaireModel = jest.fn(() => ({
      ...mockMakeupBagQuestionnaireResponse,
      save: jest.fn().mockResolvedValue(mockMakeupBagQuestionnaireResponse),
    })) as any;

    mockMakeupBagQuestionnaireModel.find = jest.fn();
    mockMakeupBagQuestionnaireModel.findById = jest.fn();
    mockMakeupBagQuestionnaireModel.findByIdAndDelete = jest.fn();

    mockTrainingQuestionnaireModel = jest.fn(() => ({
      ...mockTrainingQuestionnaireResponse,
      create: jest.fn().mockResolvedValue(mockTrainingQuestionnaireResponse),
    })) as any;

    mockTrainingQuestionnaireModel.create = jest
      .fn()
      .mockResolvedValue(mockTrainingQuestionnaireResponse);
    mockTrainingQuestionnaireModel.find = jest.fn();
    mockTrainingQuestionnaireModel.findById = jest.fn();

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
        {
          provide: ImageService,
          useValue: mockImageService,
        },
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

        expect(mockImageService.handleImageUpload).not.toHaveBeenCalled();
        expect(result).toEqual(mockMakeupBagQuestionnaireResponse);
      });

      it('should create a questionnaire and upload image if makeupBagPhotoUrl provided', async () => {
        await service.createMakeupBag(mockMakeupBagQuestionnaire as any);

        expect(mockImageService.handleImageUpload).toHaveBeenCalledWith(
          expect.objectContaining({
            imageId: 'img-id',
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
        const mockFindChain = {
          populate: jest.fn().mockReturnThis(),
          sort: jest
            .fn()
            .mockResolvedValue([mockMakeupBagQuestionnaireResponse]),
        };

        mockMakeupBagQuestionnaireModel.find = jest
          .fn()
          .mockReturnValue(mockFindChain);

        const result = await service.findAllMakeupBags();
        expect(result).toEqual([mockMakeupBagQuestionnaireResponse]);
      });

      it('should throw NotFoundException if no questionnaires found', async () => {
        const mockFindChain = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockResolvedValue([]),
        };

        mockMakeupBagQuestionnaireModel.find = jest
          .fn()
          .mockReturnValue(mockFindChain);

        await expect(service.findAllMakeupBags()).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('findAllMakeupBagsByMua', () => {
      it('should return all questionnaires', async () => {
        const mockFindChain = {
          sort: jest
            .fn()
            .mockResolvedValue([mockMakeupBagQuestionnaireResponse]),
        };

        mockMakeupBagQuestionnaireModel.find = jest
          .fn()
          .mockReturnValue(mockFindChain);

        const result = await service.findAllMakeupBagsByMua(mockMuaId);
        expect(result).toEqual([mockMakeupBagQuestionnaireResponse]);
      });

      it('should throw NotFoundException if no questionnaires found', async () => {
        const mockFindChain = {
          sort: jest.fn().mockResolvedValue([]),
        };

        mockMakeupBagQuestionnaireModel.find = jest
          .fn()
          .mockReturnValue(mockFindChain);

        await expect(service.findAllMakeupBagsByMua(mockMuaId)).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('findOneMakeupBag', () => {
      it('should return a questionnaire by id', async () => {
        const mockFindByIdChain = {
          populate: jest
            .fn()
            .mockResolvedValue(mockMakeupBagQuestionnaireResponse),
        };

        (mockMakeupBagQuestionnaireModel.findById as jest.Mock).mockReturnValue(
          mockFindByIdChain,
        );

        const result = await service.findOneMakeupBag(
          mockMakeupBagQuestionnaireId,
        );
        expect(result).toEqual(mockMakeupBagQuestionnaireResponse);
      });

      it('should throw NotFoundException if questionnaire not found', async () => {
        const mockFindByIdChain = {
          populate: jest.fn().mockResolvedValue(null),
        };

        (mockMakeupBagQuestionnaireModel.findById as jest.Mock).mockReturnValue(
          mockFindByIdChain,
        );

        await expect(
          service.findOneMakeupBag(mockBadMakeupBagQuestionnaireId),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('removeMakeupBag', () => {
      it('should delete tool and remove image if exists', async () => {
        (
          mockMakeupBagQuestionnaireModel.findByIdAndDelete as jest.Mock
        ).mockResolvedValue(mockMakeupBagQuestionnaireResponse);

        const result = await service.removeMakeupBag(
          mockMakeupBagQuestionnaireId,
        );

        expect(mockImageService.handleImageDeletion).toHaveBeenCalledWith(
          mockMakeupBagQuestionnaireResponse.makeupBagPhotoId,
        );
        expect(result).toEqual(mockMakeupBagQuestionnaireResponse);
      });

      it('should throw NotFoundException if tool not found', async () => {
        (
          mockMakeupBagQuestionnaireModel.findByIdAndDelete as jest.Mock
        ).mockResolvedValue(null);

        await expect(
          service.removeMakeupBag(mockBadMakeupBagQuestionnaireId),
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
      it('should return all training questionnaires', async () => {
        const mockFindChain = {
          populate: jest.fn().mockReturnThis(),
          sort: jest
            .fn()
            .mockResolvedValue([mockTrainingQuestionnaireResponse]),
        };

        mockTrainingQuestionnaireModel.find = jest
          .fn()
          .mockReturnValue(mockFindChain);

        const result = await service.findAllTrainings();
        expect(result).toEqual([mockTrainingQuestionnaireResponse]);
      });

      it('should throw NotFoundException if no training questionnaires found', async () => {
        const mockFindChain = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockResolvedValue([]),
        };

        mockTrainingQuestionnaireModel.find = jest
          .fn()
          .mockReturnValue(mockFindChain);

        await expect(service.findAllTrainings()).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('findAllTrainingsByMua', () => {
      it('should return all training questionnaires', async () => {
        const mockFindChain = {
          sort: jest
            .fn()
            .mockResolvedValue([mockTrainingQuestionnaireResponse]),
        };

        mockTrainingQuestionnaireModel.find = jest
          .fn()
          .mockReturnValue(mockFindChain);

        const result = await service.findAllTrainingsByMua(mockMuaId);
        expect(result).toEqual([mockTrainingQuestionnaireResponse]);
      });

      it('should throw NotFoundException if no training questionnaires found', async () => {
        const mockFindChain = {
          sort: jest.fn().mockResolvedValue([]),
        };

        mockTrainingQuestionnaireModel.find = jest
          .fn()
          .mockReturnValue(mockFindChain);

        await expect(service.findAllTrainingsByMua(mockMuaId)).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('findOneTraining', () => {
      it('should return a training questionnaire by id', async () => {
        const mockFindByIdChain = {
          populate: jest
            .fn()
            .mockResolvedValue(mockTrainingQuestionnaireResponse),
        };

        (mockTrainingQuestionnaireModel.findById as jest.Mock).mockReturnValue(
          mockFindByIdChain,
        );

        const result = await service.findOneTraining(
          mockTrainingQuestionnaireId,
        );
        expect(result).toEqual(mockTrainingQuestionnaireResponse);
      });

      it('should throw NotFoundException if training questionnaire not found', async () => {
        const mockFindByIdChain = {
          populate: jest.fn().mockResolvedValue(null),
        };

        (mockTrainingQuestionnaireModel.findById as jest.Mock).mockReturnValue(
          mockFindByIdChain,
        );

        await expect(
          service.findOneTraining(mockBadTrainingQuestionnaireId),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });
});
