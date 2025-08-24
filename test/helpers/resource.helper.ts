import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import {
  TestBrand,
  TestCategory,
  TestDataFactory,
  TestMakeupBag,
  TestProduct,
  TestQuestionnaire,
  TestStage,
  TestTool,
} from 'test/factories/test-data.factory';

export interface TestResources {
  brandId: string;
  categoryId: string;
  productIds: string[];
  stageId: string;
  toolId: string;
}

export interface BrandResources {
  id: string;
  data: TestBrand;
}

export interface CategoryResources {
  id: string;
  data: TestCategory;
}

export interface MakeupBagResources {
  id: string;
  data: TestMakeupBag;
}

export interface ProductResources {
  id: string;
  data: TestProduct;
}

export interface QuestionnaireResources {
  id: string;
  data: TestQuestionnaire;
}

export interface StageResources {
  id: string;
  data: TestStage;
}

export interface ToolResources {
  id: string;
  data: TestTool;
}

export class ResourceHelper {
  static async setupBasicResources(
    app: INestApplication,
    adminToken: string,
  ): Promise<TestResources> {
    const categoryResources = await this.createCategory(app, adminToken);
    const brandResources = await this.createBrand(app, adminToken);

    const productResources = await this.createProduct(
      app,
      adminToken,
      brandResources.id,
    );

    const stageResources = await this.createStage(app, adminToken, [
      brandResources.id,
    ]);

    const toolResources = await this.createTool(
      app,
      adminToken,
      brandResources.id,
    );

    return {
      brandId: brandResources.id,
      categoryId: categoryResources.id,
      productIds: [productResources.id],
      stageId: stageResources.id,
      toolId: toolResources.id,
    };
  }

  static async createBrand(
    app: INestApplication,
    adminToken: string,
  ): Promise<BrandResources> {
    const data = TestDataFactory.createBrand();

    const response = await request(app.getHttpServer())
      .post('/brands')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(data)
      .expect(HttpStatus.CREATED);

    return {
      id: response.body.id,
      data,
    };
  }

  static async createCategory(
    app: INestApplication,
    adminToken: string,
  ): Promise<CategoryResources> {
    const data = TestDataFactory.createCategory();

    const response = await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(data)
      .expect(HttpStatus.CREATED);

    return {
      id: response.body.id,
      data,
    };
  }

  static async createMakeupBag(
    app: INestApplication,
    adminToken: string,
    categoryId: string,
    clientId: string,
    stageIds: string[] = [],
    toolIds: string[] = [],
  ): Promise<MakeupBagResources> {
    const data = TestDataFactory.createMakeupBag(
      categoryId,
      clientId,
      stageIds,
      toolIds,
    );

    const response = await request(app.getHttpServer())
      .post('/makeup-bags')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(data)
      .expect(HttpStatus.CREATED);

    return {
      id: response.body.id,
      data,
    };
  }

  static async createProduct(
    app: INestApplication,
    adminToken: string,
    brandId: string,
  ): Promise<ProductResources> {
    const data = TestDataFactory.createProduct(brandId);

    const response = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(data)
      .expect(HttpStatus.CREATED);

    return {
      id: response.body.id,
      data,
    };
  }

  static async createQuestionnaire(
    app: INestApplication,
  ): Promise<QuestionnaireResources> {
    const data = TestDataFactory.createQuestionnaire();

    const response = await request(app.getHttpServer())
      .post('/questionnaires')
      .send(data)
      .expect(HttpStatus.CREATED);

    return {
      id: response.body.id,
      data,
    };
  }

  static async createStage(
    app: INestApplication,
    adminToken: string,
    brandIds: string[],
  ): Promise<StageResources> {
    const data = TestDataFactory.createStage(brandIds);

    const response = await request(app.getHttpServer())
      .post('/stages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(data)
      .expect(HttpStatus.CREATED);

    return {
      id: response.body.id,
      data,
    };
  }

  static async createTool(
    app: INestApplication,
    adminToken: string,
    brandId: string,
  ): Promise<ToolResources> {
    const data = TestDataFactory.createTool(brandId);

    const response = await request(app.getHttpServer())
      .post('/tools')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(data)
      .expect(HttpStatus.CREATED);

    return {
      id: response.body.id,
      data,
    };
  }
}
