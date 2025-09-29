import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { ErrorCode } from 'src/common/enums/error-code.enum';
import { UploadFolder } from 'src/common/enums/upload-folder.enum';
import { ImageService } from '../shared/image.service';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';
import { CreateTrainingDto } from './dto/create-training.dto';
import {
  Questionnaire,
  QuestionnaireDocument,
} from './schemas/questionnaire.schema';
import { Training, TrainingDocument } from './schemas/training.schema';

@Injectable()
export class QuestionnairesService {
  constructor(
    @InjectModel(Questionnaire.name)
    private readonly questionnaireModel: Model<QuestionnaireDocument>,
    @InjectModel(Training.name)
    private readonly trainingModel: Model<TrainingDocument>,
    private readonly imageService: ImageService,
  ) {}

  private createImageAdapter = (questionnaire: QuestionnaireDocument) => ({
    ...questionnaire,
    imageId: questionnaire.makeupBagPhotoId,
    imageUrl: questionnaire.makeupBagPhotoUrl || '',
  });

  async create(dto: CreateQuestionnaireDto) {
    const questionnaire = new this.questionnaireModel(dto);
    const { makeupBagPhotoUrl } = dto;

    if (makeupBagPhotoUrl) {
      const adapter = this.createImageAdapter(questionnaire);

      await this.imageService.handleImageUpload(adapter, {
        filename: 'makeup-bag',
        folder: `${UploadFolder.QUESTIONNAIRES}/${questionnaire._id}`,
        secureUrl: makeupBagPhotoUrl,
      });

      questionnaire.makeupBagPhotoId = adapter.imageId;
      questionnaire.makeupBagPhotoUrl = adapter.imageUrl;
    }

    return questionnaire.save();
  }

  async createTraining(dto: CreateTrainingDto) {
    const training = new this.trainingModel(dto);
    return training.save();
  }

  async findAll() {
    const questionnaires = await this.questionnaireModel.find();

    if (!questionnaires.length) {
      throw new NotFoundException({ code: ErrorCode.QUESTIONNAIRES_NOT_FOUND });
    }

    return questionnaires;
  }

  async findOne(id: Types.ObjectId) {
    const questionnaire = await this.questionnaireModel.findById(id);

    if (!questionnaire) {
      throw new NotFoundException({ code: ErrorCode.QUESTIONNAIRE_NOT_FOUND });
    }

    return questionnaire;
  }

  async findAllTrainings(): Promise<TrainingDocument[]> {
    const trainings = await this.trainingModel.find();

    if (!trainings.length) {
      throw new NotFoundException({ code: ErrorCode.TRAININGS_NOT_FOUND });
    }

    return trainings;
  }

  async findOneTraining(id: Types.ObjectId) {
    const training = await this.trainingModel.findById(id);

    if (!training) {
      throw new NotFoundException({ code: ErrorCode.TRAINING_NOT_FOUND });
    }

    return training;
  }
}
