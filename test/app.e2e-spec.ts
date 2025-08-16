import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { App } from 'supertest/types';

import { AppController } from 'src/app.controller';
import { AppService } from 'src/app.service';
import configuration from 'src/config/configuration';
import { BrandsModule } from 'src/modules/brands/brands.module';
import { CategoriesModule } from 'src/modules/categories/categories.module';
import { LessonsModule } from 'src/modules/lessons/lessons.module';
import { MakeupBagsModule } from 'src/modules/makeup-bags/makeup-bags.module';
import { ProductsModule } from 'src/modules/products/products.module';
import { QuestionnairesModule } from 'src/modules/questionnaires/questionnaires.module';
import { SharedModule } from 'src/modules/shared/shared.module';
import { StagesModule } from 'src/modules/stages/stages.module';
import { StoresModule } from 'src/modules/stores/stores.module';
import { ToolsModule } from 'src/modules/tools/tools.module';
import { UploadsModule } from 'src/modules/uploads/uploads.module';
import { UsersModule } from 'src/modules/users/users.module';
import { DatabaseHelper, TestDatabaseModule } from './helpers/database.helper';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
          envFilePath: `.env.${process.env.NODE_ENV || 'development'}.local`,
        }),
        TestDatabaseModule,
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
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await DatabaseHelper.closeConnection();
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(HttpStatus.OK)
      .expect('Hello World!');
  });
});
