import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { TestDataFactory } from 'test/factories/test-data.factory';

export interface TestResources {
  brandId: string;
  categoryId: string;
  productIds: string[];
  stageId: string;
  toolId: string;
}

export class ResourceHelper {
  static async setupBasicResources(
    app: INestApplication,
    adminToken: string,
  ): Promise<TestResources> {
    const categoryData = TestDataFactory.createCategory();
    const category = await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(categoryData)
      .expect(HttpStatus.CREATED);
    const categoryId = category.body.id;

    const brandData = TestDataFactory.createBrand();
    const brand = await request(app.getHttpServer())
      .post('/brands')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(brandData)
      .expect(HttpStatus.CREATED);
    const brandId = brand.body.id;

    const productData = TestDataFactory.createProduct(brandId);
    const product = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(productData)
      .expect(HttpStatus.CREATED);
    const productIds = [product.body.id];

    const stageData = TestDataFactory.createStage(productIds);
    const stage = await request(app.getHttpServer())
      .post('/stages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(stageData)
      .expect(HttpStatus.CREATED);
    const stageId = stage.body.id;

    const toolData = TestDataFactory.createTool(brandId);
    const tool = await request(app.getHttpServer())
      .post('/tools')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(toolData)
      .expect(HttpStatus.CREATED);
    const toolId = tool.body.id;

    return {
      brandId,
      categoryId,
      productIds,
      stageId,
      toolId,
    };
  }
}
