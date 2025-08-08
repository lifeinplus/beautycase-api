import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { AuthModule } from './modules/auth/auth.module';
import { BrandsModule } from './modules/brands/brands.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { MakeupBagsModule } from './modules/makeup-bags/makeup-bags.module';
import { ProductsModule } from './modules/products/products.module';
import { QuestionnairesModule } from './modules/questionnaires/questionnaires.module';
import { SharedModule } from './modules/shared/shared.module';
import { StagesModule } from './modules/stages/stages.module';
import { StoresModule } from './modules/stores/stores.module';
import { ToolsModule } from './modules/tools/tools.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}.local`,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),
    AuthModule,
    BrandsModule,
    CategoriesModule,
    LessonsModule,
    MakeupBagsModule,
    ProductsModule,
    QuestionnairesModule,
    SharedModule,
    StagesModule,
    StoresModule,
    ToolsModule,
    UploadsModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
