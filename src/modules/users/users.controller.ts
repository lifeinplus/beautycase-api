import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';

import { Roles } from 'src/common/decorators/roles.decorator';
import { ObjectIdParamDto } from 'src/common/dto/object-id-param.dto';
import { Role } from 'src/common/enums/role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MUA)
  findAll() {
    return this.usersService.findAll();
  }

  @Get('muas')
  findAllMuas() {
    return this.usersService.findAllMuas();
  }

  @Get(':id')
  findOne(@Param() params: ObjectIdParamDto) {
    return this.usersService.findOne(params.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param() params: ObjectIdParamDto) {
    const user = await this.usersService.remove(params.id);
    return { id: user.id };
  }
}
