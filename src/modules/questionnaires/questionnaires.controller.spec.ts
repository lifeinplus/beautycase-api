import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestDataFactory } from 'test/factories/test-data.factory';
import { QuestionnairesController } from './questionnaires.controller';
import { QuestionnairesService } from './questionnaires.service';

describe('QuestionnairesController', () => {
  let controller: QuestionnairesController;
  let service: QuestionnairesService;

  const mockQuestionnaire = TestDataFactory.createQuestionnaire();

  const mockQuestionnaireResponse = {
    ...mockQuestionnaire,
    id: '507f1f77bcf86cd799439011',
  };

  const mockQuestionnairesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionnairesController],
      providers: [
        {
          provide: QuestionnairesService,
          useValue: mockQuestionnairesService,
        },
      ],
    }).compile();

    controller = module.get<QuestionnairesController>(QuestionnairesController);
    service = module.get<QuestionnairesService>(QuestionnairesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should return id and success message after creation', async () => {
      mockQuestionnairesService.create.mockResolvedValue(
        mockQuestionnaireResponse,
      );

      const result = await controller.create(mockQuestionnaire);

      expect(service.create).toHaveBeenCalledWith(mockQuestionnaire);
      expect(result).toEqual({
        id: mockQuestionnaireResponse.id,
        message: 'Questionnaire created successfully',
      });
    });
  });

  describe('findAll', () => {
    it('should return all questionnaires', async () => {
      mockQuestionnairesService.findAll.mockResolvedValue([
        mockQuestionnaireResponse,
      ]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockQuestionnaireResponse]);
    });
  });

  describe('findOne', () => {
    it('should return questionnaire by id', async () => {
      mockQuestionnairesService.findOne.mockResolvedValue(
        mockQuestionnaireResponse,
      );

      const result = await controller.findOne({ id: 'questionnaire-id' });

      expect(service.findOne).toHaveBeenCalledWith('questionnaire-id');
      expect(result).toEqual(mockQuestionnaireResponse);
    });

    it('should throw NotFoundException if questionnaire not found', async () => {
      mockQuestionnairesService.findOne.mockRejectedValue(
        new NotFoundException(),
      );

      await expect(controller.findOne({ id: 'not-found' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
