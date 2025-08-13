import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';
import { QuestionnairesController } from './questionnaires.controller';
import { QuestionnairesService } from './questionnaires.service';

describe('QuestionnairesController', () => {
  let controller: QuestionnairesController;
  let service: QuestionnairesService;

  const mockQuestionnaire = {
    id: '507f1f77bcf86cd799439011',
    name: 'Jane Doe',
    makeupBag: 'bag-id',
    createdAt: new Date(),
    updatedAt: new Date(),
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

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should return id and success message after creation', async () => {
      const dto: CreateQuestionnaireDto = {
        name: 'Jane Doe',
        makeupBag: 'bag-id',
      };

      mockQuestionnairesService.create.mockResolvedValue(mockQuestionnaire);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        id: mockQuestionnaire.id,
        message: 'Questionnaire created successfully',
      });
    });
  });

  describe('findAll', () => {
    it('should return all questionnaires', async () => {
      mockQuestionnairesService.findAll.mockResolvedValue([mockQuestionnaire]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockQuestionnaire]);
    });
  });

  describe('findOne', () => {
    it('should return questionnaire by id', async () => {
      mockQuestionnairesService.findOne.mockResolvedValue(mockQuestionnaire);

      const result = await controller.findOne({ id: 'questionnaire-id' });

      expect(service.findOne).toHaveBeenCalledWith('questionnaire-id');
      expect(result).toEqual(mockQuestionnaire);
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
