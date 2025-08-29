import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import {
  TestBrand,
  TestCategory,
  TestDataFactory,
  TestLesson,
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

export interface TestLessonResources {
  brandId: string;
  productId: string;
}

export interface BrandResources {
  id: string;
  data: TestBrand;
}

export interface CategoryResources {
  id: string;
  data: TestCategory;
}

export interface LessonResources {
  id: string;
  data: TestLesson;
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
  static async setupLessonResources(
    app: INestApplication,
    adminToken: string,
  ): Promise<TestLessonResources> {
    const brand = await this.createBrand(app, adminToken);
    const product = await this.createProduct(app, adminToken, brand.id);

    return {
      brandId: brand.id,
      productId: product.id,
    };
  }

  static async setupBasicResources(
    app: INestApplication,
    adminToken: string,
  ): Promise<TestResources> {
    const category = await this.createCategory(app, adminToken);
    const brand = await this.createBrand(app, adminToken);
    const product = await this.createProduct(app, adminToken, brand.id);
    const stage = await this.createStage(app, adminToken, [brand.id]);
    const tool = await this.createTool(app, adminToken, brand.id);

    return {
      brandId: brand.id,
      categoryId: category.id,
      productIds: [product.id],
      stageId: stage.id,
      toolId: tool.id,
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

  static async createMultipleBrands(
    app: INestApplication,
    adminToken: string,
    count: number,
  ): Promise<BrandResources[]> {
    const brands: BrandResources[] = [];
    const brandsData = TestDataFactory.createMultipleBrands(count);

    for (const data of brandsData) {
      const { body } = await request(app.getHttpServer())
        .post('/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data)
        .expect(HttpStatus.CREATED);

      brands.push({ id: body.id, data });
    }

    return brands;
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

  static async createMultipleCategories(
    app: INestApplication,
    adminToken: string,
    count: number,
  ): Promise<CategoryResources[]> {
    const categories: CategoryResources[] = [];
    const categoriesData = TestDataFactory.createMultipleCategories(count);

    for (const data of categoriesData) {
      const { body } = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data)
        .expect(HttpStatus.CREATED);

      categories.push({ id: body.id, data });
    }

    return categories;
  }

  static async createLesson(
    app: INestApplication,
    adminToken: string,
    productIds: string[] = [],
    clientIds: string[] = [],
  ): Promise<LessonResources> {
    const data = TestDataFactory.createLesson(productIds, clientIds);

    const response = await request(app.getHttpServer())
      .post('/lessons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(data)
      .expect(HttpStatus.CREATED);

    return {
      id: response.body.id,
      data,
    };
  }

  static async createMultipleLessons(
    app: INestApplication,
    adminToken: string,
    count: number,
    productIds: string[] = [],
    clientIds: string[] = [],
  ): Promise<LessonResources[]> {
    const lessons: LessonResources[] = [];
    const lessonsData = TestDataFactory.createMultipleLessons(
      count,
      productIds,
      clientIds,
    );

    for (const data of lessonsData) {
      const { body } = await request(app.getHttpServer())
        .post('/lessons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data)
        .expect(HttpStatus.CREATED);

      lessons.push({ id: body.id, data });
    }

    return lessons;
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

  static async createMultipleProducts(
    app: INestApplication,
    adminToken: string,
    count: number,
    brandId: string,
  ): Promise<ProductResources[]> {
    const products: ProductResources[] = [];
    const productsData = TestDataFactory.createMultipleProducts(count, brandId);

    for (const data of productsData) {
      const { body } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data)
        .expect(HttpStatus.CREATED);

      products.push({ id: body.id, data });
    }

    return products;
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
    productIds: string[],
  ): Promise<StageResources> {
    const data = TestDataFactory.createStage(productIds);

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

  static async createMultipleStages(
    app: INestApplication,
    adminToken: string,
    count: number,
    productIds: string[],
  ): Promise<StageResources[]> {
    const stages: StageResources[] = [];
    const stagesData = TestDataFactory.createMultipleStages(count, productIds);

    for (const data of stagesData) {
      const { body } = await request(app.getHttpServer())
        .post('/stages')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data)
        .expect(HttpStatus.CREATED);

      stages.push({ id: body.id, data });
    }

    return stages;
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
