import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { ErrorCode } from 'src/common/enums/error-code.enum';
import { UploadFolder } from 'src/common/enums/upload-folder.enum';
import { ImageService } from '../shared/image.service';
import { CreateMakeupBagQuestionnaireDto } from './dto/create-makeup-bag-questionnaire.dto';
import { CreateTrainingQuestionnaireDto } from './dto/create-training-questionnaire.dto';
import {
  MakeupBagQuestionnaire,
  MakeupBagQuestionnaireDocument,
} from './schemas/makeup-bag-questionnaire.schema';
import {
  TrainingQuestionnaire,
  TrainingQuestionnaireDocument,
} from './schemas/training-questionnaire.schema';

@Injectable()
export class QuestionnairesService {
  constructor(
    @InjectModel(MakeupBagQuestionnaire.name)
    private readonly makeupBagQuestionnaireModel: Model<MakeupBagQuestionnaireDocument>,
    @InjectModel(TrainingQuestionnaire.name)
    private readonly trainingQuestionnaireModel: Model<TrainingQuestionnaireDocument>,
    private readonly imageService: ImageService,
  ) {}

  private createImageAdapter = (
    questionnaire: MakeupBagQuestionnaireDocument,
  ) => ({
    ...questionnaire,
    imageId: questionnaire.makeupBagPhotoId,
    imageUrl: questionnaire.makeupBagPhotoUrl || '',
  });

  async createMakeupBag(dto: CreateMakeupBagQuestionnaireDto) {
    const questionnaire = new this.makeupBagQuestionnaireModel(dto);
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

  createTraining(
    dto: CreateTrainingQuestionnaireDto,
  ): Promise<TrainingQuestionnaireDocument> {
    return this.trainingQuestionnaireModel.create(dto);
  }

  async findAllMakeupBags() {
    const questionnaires = await this.makeupBagQuestionnaireModel.find();

    if (!questionnaires.length) {
      throw new NotFoundException({ code: ErrorCode.QUESTIONNAIRES_NOT_FOUND });
    }

    return questionnaires;
  }

  async findAllTrainings(): Promise<TrainingQuestionnaireDocument[]> {
    const questionnaires = await this.trainingQuestionnaireModel.find();

    if (!questionnaires.length) {
      throw new NotFoundException({ code: ErrorCode.QUESTIONNAIRES_NOT_FOUND });
    }

    return questionnaires;
  }

  async findOneMakeupBag(id: Types.ObjectId) {
    const questionnaire = await this.makeupBagQuestionnaireModel.findById(id);

    if (!questionnaire) {
      throw new NotFoundException({ code: ErrorCode.QUESTIONNAIRE_NOT_FOUND });
    }

    return questionnaire;
  }

  async findOneTraining(id: Types.ObjectId) {
    const questionnaire = await this.trainingQuestionnaireModel.findById(id);

    if (!questionnaire) {
      throw new NotFoundException({ code: ErrorCode.QUESTIONNAIRE_NOT_FOUND });
    }

    return questionnaire;
  }

  async removeMakeupBag(
    id: Types.ObjectId,
  ): Promise<MakeupBagQuestionnaireDocument> {
    const questionnaire =
      await this.makeupBagQuestionnaireModel.findByIdAndDelete(id);

    if (!questionnaire) {
      throw new NotFoundException({ code: ErrorCode.QUESTIONNAIRE_NOT_FOUND });
    }

    if (questionnaire.makeupBagPhotoId) {
      await this.imageService.handleImageDeletion(
        questionnaire.makeupBagPhotoId,
      );
    }

    return questionnaire;
  }

  async removeTraining(
    id: Types.ObjectId,
  ): Promise<TrainingQuestionnaireDocument> {
    const questionnaire =
      await this.trainingQuestionnaireModel.findByIdAndDelete(id);

    if (!questionnaire) {
      throw new NotFoundException({ code: ErrorCode.QUESTIONNAIRE_NOT_FOUND });
    }

    return questionnaire;
  }
}
