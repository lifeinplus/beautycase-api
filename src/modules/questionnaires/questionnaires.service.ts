import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { UploadFolder } from 'src/common/enums/upload-folder.enum';
import { ImageService } from '../shared/image.service';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';
import {
  Questionnaire,
  QuestionnaireDocument,
} from './schemas/questionnaire.schema';

@Injectable()
export class QuestionnairesService {
  constructor(
    @InjectModel(Questionnaire.name)
    private readonly questionnaireModel: Model<QuestionnaireDocument>,
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

  async findAll() {
    const questionnaires = await this.questionnaireModel.find();

    if (!questionnaires.length) {
      throw new NotFoundException({ code: 'QUESTIONNAIRES_NOT_FOUND' });
    }

    return questionnaires;
  }

  async findOne(id: Types.ObjectId) {
    const questionnaire = await this.questionnaireModel.findById(id);

    if (!questionnaire) {
      throw new NotFoundException({ code: 'QUESTIONNAIRE_NOT_FOUND' });
    }

    return questionnaire;
  }
}
