import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';

import { Public } from 'src/common/decorators/public.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ObjectIdParamDto } from 'src/common/dto/object-id-param.dto';
import { Role } from 'src/common/enums/role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  @Get('clients')
  @Roles(Role.MUA)
  findAllClients() {
    return this.usersService.findAllClients();
  }

  @Get('muas')
  @Public()
  findAllMuas() {
    return this.usersService.findAllMuas();
  }

  @Get(':id')
  @Roles()
  findOne(@Param() params: ObjectIdParamDto) {
    return this.usersService.findOne(params.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param() params: ObjectIdParamDto) {
    const user = await this.usersService.remove(params.id);
    return { id: user.id };
  }
}
