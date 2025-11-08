import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { TestDataFactory } from 'test/factories/test-data.factory';
import { makeObjectId } from 'test/helpers/make-object-id.helper';
import { QuestionnairesController } from './questionnaires.controller';
import { QuestionnairesService } from './questionnaires.service';

describe('QuestionnairesController', () => {
  let controller: QuestionnairesController;
  let service: QuestionnairesService;

  const mockMuaId = makeObjectId();

  const mockMakeupBagQuestionnaire =
    TestDataFactory.createMakeupBagQuestionnaire(mockMuaId);
  const mockMakeupBagQuestionnaireId = makeObjectId();
  const mockBadMakeupBagQuestionnaireId = makeObjectId();
  const mockMakeupBagQuestionnaireResponse = {
    ...mockMakeupBagQuestionnaire,
    id: mockMakeupBagQuestionnaireId,
  };

  const mockTrainingQuestionnaire =
    TestDataFactory.createTrainingQuestionnaire(mockMuaId);
  const mockTrainingQuestionnaireId = makeObjectId();
  const mockBadTrainingQuestionnaireId = makeObjectId();
  const mockTrainingQuestionnaireResponse = {
    ...mockTrainingQuestionnaire,
    id: mockTrainingQuestionnaireId,
  };

  const mockQuestionnairesService = {
    createMakeupBag: jest.fn(),
    findAllMakeupBags: jest.fn(),
    findAllMakeupBagsByMua: jest.fn(),
    findOneMakeupBag: jest.fn(),
    removeMakeupBag: jest.fn(),
    createTraining: jest.fn(),
    findAllTrainings: jest.fn(),
    findAllTrainingsByMua: jest.fn(),
    findOneTraining: jest.fn(),
    removeTraining: jest.fn(),
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

    describe('findAllMakeupBagsByMua', () => {
      it('should return all makeup bags for a specific MUA', async () => {
        mockQuestionnairesService.findAllMakeupBagsByMua = jest
          .fn()
          .mockResolvedValue([mockMakeupBagQuestionnaireResponse]);

        const mockReq = { user: { id: mockMuaId } } as any;

        const result = await controller.findAllMakeupBagsByMua(mockReq);

        expect(service.findAllMakeupBagsByMua).toHaveBeenCalledWith(mockMuaId);
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

    describe('removeMakeupBag', () => {
      it('should remove a questionnaire and return its id', async () => {
        mockQuestionnairesService.removeMakeupBag = jest
          .fn()
          .mockResolvedValue(mockMakeupBagQuestionnaireResponse);

        const result = await controller.removeMakeupBag({
          id: mockMakeupBagQuestionnaireId,
        });

        expect(service.removeMakeupBag).toHaveBeenCalledWith(
          mockMakeupBagQuestionnaireId,
        );
        expect(result).toEqual({ id: mockMakeupBagQuestionnaireResponse.id });
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

    describe('findAllTrainingsByMua', () => {
      it('should return all training questionnaires for a specific MUA', async () => {
        mockQuestionnairesService.findAllTrainingsByMua = jest
          .fn()
          .mockResolvedValue([mockTrainingQuestionnaireResponse]);

        const mockReq = { user: { id: mockMuaId } } as any;

        const result = await controller.findAllTrainingsByMua(mockReq);

        expect(service.findAllTrainingsByMua).toHaveBeenCalledWith(mockMuaId);
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

    describe('removeTraining', () => {
      it('should remove a training questionnaire and return its id', async () => {
        mockQuestionnairesService.removeTraining = jest
          .fn()
          .mockResolvedValue(mockTrainingQuestionnaireResponse);

        const result = await controller.removeTraining({
          id: mockTrainingQuestionnaireId,
        });

        expect(service.removeTraining).toHaveBeenCalledWith(
          mockTrainingQuestionnaireId,
        );
        expect(result).toEqual({ id: mockTrainingQuestionnaireResponse.id });
      });
    });
  });
});
