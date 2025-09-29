import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { Roles } from 'src/common/decorators/roles.decorator';
import { ObjectIdParamDto } from 'src/common/dto/object-id-param.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';
import { CreateTrainingDto } from './dto/create-training.dto';
import { QuestionnairesService } from './questionnaires.service';

@Controller('questionnaires')
export class QuestionnairesController {
  constructor(private readonly questionnairesService: QuestionnairesService) {}

  @Post()
  async create(@Body() dto: CreateQuestionnaireDto) {
    const questionnaire = await this.questionnairesService.create(dto);

    return {
      id: questionnaire.id,
      message: 'Questionnaire created successfully',
    };
  }

  @Post('training')
  async createTraining(@Body() dto: CreateTrainingDto) {
    const training = await this.questionnairesService.createTraining(dto);

    return {
      id: training.id,
      message: 'Training questionnaire created successfully',
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'mua')
  findAll() {
    return this.questionnairesService.findAll();
  }

  @Get('trainings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'mua')
  findAllTrainings() {
    return this.questionnairesService.findAllTrainings();
  }

  @Get('trainings/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'mua')
  findOneTraining(@Param() params: ObjectIdParamDto) {
    return this.questionnairesService.findOneTraining(params.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'mua')
  findOne(@Param() params: ObjectIdParamDto) {
    return this.questionnairesService.findOne(params.id);
  }
}
