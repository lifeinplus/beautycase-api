import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { TestDataFactory } from 'test/factories/test-data.factory';
import { QuestionnairesController } from './questionnaires.controller';
import { QuestionnairesService } from './questionnaires.service';

describe('QuestionnairesController', () => {
  let controller: QuestionnairesController;
  let service: QuestionnairesService;

  const mockMakeupBagQuestionnaire =
    TestDataFactory.createMakeupBagQuestionnaire();
  const mockMakeupBagQuestionnaireId = new Types.ObjectId();
  const mockBadMakeupBagQuestionnaireId = new Types.ObjectId();
  const mockMakeupBagQuestionnaireResponse = {
    ...mockMakeupBagQuestionnaire,
    id: mockMakeupBagQuestionnaireId,
  };

  const mockTrainingQuestionnaire =
    TestDataFactory.createTrainingQuestionnaire();
  const mockTrainingQuestionnaireId = new Types.ObjectId();
  const mockBadTrainingQuestionnaireId = new Types.ObjectId();
  const mockTrainingQuestionnaireResponse = {
    ...mockTrainingQuestionnaire,
    id: mockTrainingQuestionnaireId,
  };

  const mockQuestionnairesService = {
    createMakeupBag: jest.fn(),
    createTraining: jest.fn(),
    findAllMakeupBags: jest.fn(),
    findAllTrainings: jest.fn(),
    findOneMakeupBag: jest.fn(),
    findOneTraining: jest.fn(),
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

  describe('makeup-bags', () => {
    describe('createMakeupBag', () => {
      it('should return id after creation', async () => {
        mockQuestionnairesService.createMakeupBag.mockResolvedValue(
          mockMakeupBagQuestionnaireResponse,
        );

        const result = await controller.createMakeupBag(
          mockMakeupBagQuestionnaire,
        );

        expect(service.createMakeupBag).toHaveBeenCalledWith(
          mockMakeupBagQuestionnaire,
        );
        expect(result).toEqual({ id: mockMakeupBagQuestionnaireResponse.id });
      });
    });

    describe('findAllMakeupBags', () => {
      it('should return all questionnaires', async () => {
        mockQuestionnairesService.findAllMakeupBags.mockResolvedValue([
          mockMakeupBagQuestionnaireResponse,
        ]);

        const result = await controller.findAllMakeupBags();

        expect(service.findAllMakeupBags).toHaveBeenCalled();
        expect(result).toEqual([mockMakeupBagQuestionnaireResponse]);
      });
    });

    describe('findOneMakeupBag', () => {
      it('should return questionnaire by id', async () => {
        mockQuestionnairesService.findOneMakeupBag.mockResolvedValue(
          mockMakeupBagQuestionnaireResponse,
        );

        const result = await controller.findOneMakeupBag({
          id: mockMakeupBagQuestionnaireId,
        });

        expect(service.findOneMakeupBag).toHaveBeenCalledWith(
          mockMakeupBagQuestionnaireId,
        );
        expect(result).toEqual(mockMakeupBagQuestionnaireResponse);
      });

      it('should throw NotFoundException if questionnaire not found', async () => {
        mockQuestionnairesService.findOneMakeupBag.mockRejectedValue(
          new NotFoundException(),
        );

        await expect(
          controller.findOneMakeupBag({ id: mockBadMakeupBagQuestionnaireId }),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('trainings', () => {
    describe('createTraining', () => {
      it('should return id after creation', async () => {
        mockQuestionnairesService.createTraining.mockResolvedValue(
          mockTrainingQuestionnaireResponse,
        );

        const result = await controller.createTraining(
          mockTrainingQuestionnaire,
        );

        expect(service.createTraining).toHaveBeenCalledWith(
          mockTrainingQuestionnaire,
        );
        expect(result).toEqual({ id: mockTrainingQuestionnaireResponse.id });
      });
    });

    describe('findAllTrainings', () => {
      it('should return all questionnaires', async () => {
        mockQuestionnairesService.findAllTrainings.mockResolvedValue([
          mockTrainingQuestionnaireResponse,
        ]);

        const result = await controller.findAllTrainings();

        expect(service.findAllTrainings).toHaveBeenCalled();
        expect(result).toEqual([mockTrainingQuestionnaireResponse]);
      });
    });

    describe('findOneTraining', () => {
      it('should return questionnaire by id', async () => {
        mockQuestionnairesService.findOneTraining.mockResolvedValue(
          mockTrainingQuestionnaireResponse,
        );

        const result = await controller.findOneTraining({
          id: mockTrainingQuestionnaireId,
        });

        expect(service.findOneTraining).toHaveBeenCalledWith(
          mockTrainingQuestionnaireId,
        );
        expect(result).toEqual(mockTrainingQuestionnaireResponse);
      });

      it('should throw NotFoundException if questionnaire not found', async () => {
        mockQuestionnairesService.findOneTraining.mockRejectedValue(
          new NotFoundException(),
        );

        await expect(
          controller.findOneTraining({ id: mockBadTrainingQuestionnaireId }),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });
});
