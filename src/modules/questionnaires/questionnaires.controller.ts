import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { Roles } from 'src/common/decorators/roles.decorator';
import { ObjectIdParamDto } from 'src/common/dto/object-id-param.dto';
import { Role } from 'src/common/enums/role.enum';
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
    return { id: questionnaire.id };
  }

  @Post('trainings')
  async createTraining(@Body() dto: CreateTrainingQuestionnaireDto) {
    const questionnaire = await this.questionnairesService.createTraining(dto);
    return { id: questionnaire.id };
  }

  @Get('makeup-bags')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MUA)
  findAllMakeupBags() {
    return this.questionnairesService.findAllMakeupBags();
  }

  @Get('trainings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MUA)
  findAllTrainings() {
    return this.questionnairesService.findAllTrainings();
  }

  @Get('makeup-bags/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MUA)
  findOneMakeupBag(@Param() params: ObjectIdParamDto) {
    return this.questionnairesService.findOneMakeupBag(params.id);
  }

  @Get('trainings/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MUA)
  findOneTraining(@Param() params: ObjectIdParamDto) {
    return this.questionnairesService.findOneTraining(params.id);
  }

  @Delete('makeup-bags/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async removeMakeupBag(@Param() params: ObjectIdParamDto) {
    const questionnaire = await this.questionnairesService.removeMakeupBag(
      params.id,
    );
    return { id: questionnaire.id };
  }

  @Delete('trainings/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async removeTraining(@Param() params: ObjectIdParamDto) {
    const questionnaire = await this.questionnairesService.removeTraining(
      params.id,
    );
    return { id: questionnaire.id };
  }
}
