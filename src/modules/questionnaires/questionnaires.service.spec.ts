import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';

import { NotFoundException } from '@nestjs/common';
import { UploadFolder } from 'src/common/enums/upload-folder.enum';
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

  const mockQuestionnaire = {
    _id: 'questionnaire-id',
    name: 'Jane Doe',
    makeupBag: 'bag-id',
    save: jest.fn(),
  };

  beforeEach(async () => {
    mockQuestionnaireModel = jest.fn(() => ({
      ...mockQuestionnaire,
      save: jest.fn().mockResolvedValue(mockQuestionnaire),
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a questionnaire without image upload', async () => {
      const dto = { name: 'Jane Doe', makeupBag: 'bag-id' };
      const result = await service.create(dto as any);

      expect(imageService.handleImageUpload).not.toHaveBeenCalled();
      expect(result).toEqual(mockQuestionnaire);
    });

    it('should create a questionnaire and upload image if makeupBagPhotoUrl provided', async () => {
      const dto = {
        name: 'Jane Doe',
        makeupBag: 'bag-id',
        makeupBagPhotoUrl: 'http://example.com/photo.jpg',
      };

      await service.create(dto as any);

      expect(imageService.handleImageUpload).toHaveBeenCalledWith(
        expect.objectContaining({ imageId: undefined, imageUrl: '' }),
        {
          filename: 'makeup-bag',
          folder: `${UploadFolder.QUESTIONNAIRES}/${mockQuestionnaire._id}`,
          secureUrl: 'http://example.com/photo.jpg',
        },
      );
    });
  });

  describe('findAll', () => {
    it('should return all questionnaires', async () => {
      (mockQuestionnaireModel.find as jest.Mock).mockResolvedValue([
        mockQuestionnaire,
      ]);

      const result = await service.findAll();
      expect(result).toEqual([mockQuestionnaire]);
    });

    it('should throw NotFoundException if no questionnaires found', async () => {
      (mockQuestionnaireModel.find as jest.Mock).mockResolvedValue([]);

      await expect(service.findAll()).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return a questionnaire by id', async () => {
      (mockQuestionnaireModel.findById as jest.Mock).mockResolvedValue(
        mockQuestionnaire,
      );

      const result = await service.findOne('questionnaire-id');
      expect(result).toEqual(mockQuestionnaire);
    });

    it('should throw NotFoundException if questionnaire not found', async () => {
      (mockQuestionnaireModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
