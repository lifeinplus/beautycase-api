import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { Roles } from 'src/common/decorators/roles.decorator';
import { MongoIdParamDto } from 'src/common/dto/mongo-id-param.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';
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

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'mua')
  findAll() {
    return this.questionnairesService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'mua')
  findOne(@Param() params: MongoIdParamDto) {
    return this.questionnairesService.findOne(params.id);
  }
}
