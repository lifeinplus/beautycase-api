import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import { Roles } from 'src/common/decorators/roles.decorator';
import { MongoIdParamDto } from 'src/common/dto/mongo-id-param.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'mua')
  getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Get(':id')
  getUserById(@Param() params: MongoIdParamDto) {
    return this.usersService.getUserById(params.id);
  }
}
