import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { Roles } from 'src/common/decorators/roles.decorator';
import { MongoIdParamDto } from 'src/common/dto/mongo-id-param.dto';
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

  @Get('makeup-bags')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAllMakeupBags() {
    return this.questionnairesService.findAllMakeupBags();
  }

  @Get('makeup-bags/mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MUA)
  findAllMakeupBagsByMua(@Req() req: Request) {
    const muaId = req.user!.id;
    return this.questionnairesService.findAllMakeupBagsByMua(muaId);
  }

  // TODO: @UseGuards(MakeupBagQuestionnaireAccessGuard)
  @Get('makeup-bags/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MUA)
  findOneMakeupBag(@Param() params: MongoIdParamDto) {
    return this.questionnairesService.findOneMakeupBag(params.id);
  }

  @Delete('makeup-bags/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async removeMakeupBag(@Param() params: MongoIdParamDto) {
    const questionnaire = await this.questionnairesService.removeMakeupBag(
      params.id,
    );
    return { id: questionnaire.id };
  }

  @Post('trainings')
  async createTraining(@Body() dto: CreateTrainingQuestionnaireDto) {
    const questionnaire = await this.questionnairesService.createTraining(dto);
    return { id: questionnaire.id };
  }

  @Get('trainings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAllTrainings() {
    return this.questionnairesService.findAllTrainings();
  }

  @Get('trainings/mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MUA)
  findAllTrainingsByMua(@Req() req: Request) {
    const muaId = req.user!.id;
    return this.questionnairesService.findAllTrainingsByMua(muaId);
  }

  // TODO: @UseGuards(TrainingQuestionnaireAccessGuard)
  @Get('trainings/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MUA)
  findOneTraining(@Param() params: MongoIdParamDto) {
    return this.questionnairesService.findOneTraining(params.id);
  }

  @Delete('trainings/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async removeTraining(@Param() params: MongoIdParamDto) {
    const questionnaire = await this.questionnairesService.removeTraining(
      params.id,
    );
    return { id: questionnaire.id };
  }
}
