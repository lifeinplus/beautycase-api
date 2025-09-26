import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MakeupBagsModule } from '../makeup-bags/makeup-bags.module';
import { SharedModule } from '../shared/shared.module';
import { ToolDeletionInterceptor } from './interceptors/tool-deletion.interceptor';
import { Tool, ToolSchema } from './schemas/tool.schema';
import { ToolsController } from './tools.controller';
import { ToolsService } from './tools.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Tool.name, schema: ToolSchema }]),
    MakeupBagsModule,
    SharedModule,
  ],
  controllers: [ToolsController],
  providers: [ToolsService, ToolDeletionInterceptor],
  exports: [ToolsService],
})
export class ToolsModule {}
