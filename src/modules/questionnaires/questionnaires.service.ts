import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

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

  async createMakeupBag(
    dto: CreateMakeupBagQuestionnaireDto,
  ): Promise<MakeupBagQuestionnaireDocument> {
    const questionnaire = new this.makeupBagQuestionnaireModel(dto);
    const { makeupBagPhotoIds } = dto;

    if (makeupBagPhotoIds?.length) {
      questionnaire.makeupBagPhotoIds = await Promise.all(
        makeupBagPhotoIds.map(
          async (photoId) =>
            await this.imageService.uploadImage(
              photoId,
              `${UploadFolder.QUESTIONNAIRES}/${questionnaire._id}`,
            ),
        ),
      );
    }

    return questionnaire.save();
  }

  createTraining(
    dto: CreateTrainingQuestionnaireDto,
  ): Promise<TrainingQuestionnaireDocument> {
    return this.trainingQuestionnaireModel.create(dto);
  }

  async findAllMakeupBags(): Promise<MakeupBagQuestionnaireDocument[]> {
    const questionnaires = await this.makeupBagQuestionnaireModel
      .find()
      .populate('muaId', 'firstName lastName')
      .sort({ createdAt: 'desc' });

    if (!questionnaires.length) {
      throw new NotFoundException({ code: ErrorCode.QUESTIONNAIRES_NOT_FOUND });
    }

    return questionnaires;
  }

  async findAllMakeupBagsByMua(
    muaId: string,
  ): Promise<MakeupBagQuestionnaireDocument[]> {
    const questionnaires = await this.makeupBagQuestionnaireModel
      .find({ muaId })
      .sort({ createdAt: 'desc' });

    if (!questionnaires.length) {
      throw new NotFoundException({ code: ErrorCode.QUESTIONNAIRES_NOT_FOUND });
    }

    return questionnaires;
  }

  async findAllTrainings(): Promise<TrainingQuestionnaireDocument[]> {
    const questionnaires = await this.trainingQuestionnaireModel
      .find()
      .populate('muaId', 'firstName lastName')
      .sort({ createdAt: 'desc' });

    if (!questionnaires.length) {
      throw new NotFoundException({ code: ErrorCode.QUESTIONNAIRES_NOT_FOUND });
    }

    return questionnaires;
  }

  async findAllTrainingsByMua(muaId: string) {
    const questionnaires = await this.trainingQuestionnaireModel
      .find({ muaId })
      .sort({ createdAt: 'desc' });

    if (!questionnaires.length) {
      throw new NotFoundException({ code: ErrorCode.QUESTIONNAIRES_NOT_FOUND });
    }

    return questionnaires;
  }

  async findOneMakeupBag(id: string) {
    const questionnaire = await this.makeupBagQuestionnaireModel
      .findById(id)
      .populate('muaId', 'firstName lastName username');

    if (!questionnaire) {
      throw new NotFoundException({ code: ErrorCode.QUESTIONNAIRE_NOT_FOUND });
    }

    return questionnaire;
  }

  async findOneTraining(id: string) {
    const questionnaire = await this.trainingQuestionnaireModel
      .findById(id)
      .populate('muaId', 'firstName lastName username');

    if (!questionnaire) {
      throw new NotFoundException({ code: ErrorCode.QUESTIONNAIRE_NOT_FOUND });
    }

    return questionnaire;
  }

  async removeMakeupBag(id: string): Promise<MakeupBagQuestionnaireDocument> {
    const questionnaire =
      await this.makeupBagQuestionnaireModel.findByIdAndDelete(id);

    if (!questionnaire) {
      throw new NotFoundException({ code: ErrorCode.QUESTIONNAIRE_NOT_FOUND });
    }

    const folder = `${UploadFolder.QUESTIONNAIRES}/${questionnaire.id}`;

    if (questionnaire.makeupBagPhotoIds?.length) {
      for (const photoId of questionnaire.makeupBagPhotoIds) {
        await this.imageService.deleteImage(photoId);
      }
    }

    await this.imageService.deleteFolder(folder);

    return questionnaire;
  }

  async removeTraining(id: string): Promise<TrainingQuestionnaireDocument> {
    const questionnaire =
      await this.trainingQuestionnaireModel.findByIdAndDelete(id);

    if (!questionnaire) {
      throw new NotFoundException({ code: ErrorCode.QUESTIONNAIRE_NOT_FOUND });
    }

    return questionnaire;
  }
}
