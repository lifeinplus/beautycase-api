import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { Roles } from 'src/common/decorators/roles.decorator';
import { ObjectIdParamDto } from 'src/common/dto/object-id-param.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CreateMakeupBagQuestionnaireDto } from './dto/create-makeup-bag-questionnaire.dto';
import { CreateTrainingQuestionnaireDto } from './dto/create-training-questionnaire.dto';
import { QuestionnairesService } from './questionnaires.service';

@Controller('questionnaires')
export class QuestionnairesController {
  constructor(private readonly questionnairesService: QuestionnairesService) {}

  @Post('makeup-bags')
  async createMakeupBag(@Body() dto: CreateMakeupBagQuestionnaireDto) {
    const questionnaire = await this.questionnairesService.createMakeupBag(dto);

    return {
      id: questionnaire.id,
      message: 'Makeup bag questionnaire created successfully',
    };
  }

  @Post('trainings')
  async createTraining(@Body() dto: CreateTrainingQuestionnaireDto) {
    const training = await this.questionnairesService.createTraining(dto);

    return {
      id: training.id,
      message: 'Training questionnaire created successfully',
    };
  }

  @Get('makeup-bags')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'mua')
  findAllMakeupBags() {
    return this.questionnairesService.findAllMakeupBags();
  }

  @Get('trainings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'mua')
  findAllTrainings() {
    return this.questionnairesService.findAllTrainings();
  }

  @Get('makeup-bags/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'mua')
  findOneMakeupBag(@Param() params: ObjectIdParamDto) {
    return this.questionnairesService.findOneMakeupBag(params.id);
  }

  @Get('trainings/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'mua')
  findOneTraining(@Param() params: ObjectIdParamDto) {
    return this.questionnairesService.findOneTraining(params.id);
  }
}
