import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import {
  TestBrand,
  TestCategory,
  TestDataFactory,
  TestLesson,
  TestMakeupBag,
  TestMakeupBagQuestionnaire,
  TestProduct,
  TestStage,
  TestStore,
  TestTool,
} from 'test/factories/test-data.factory';
import { AuthTokens } from './auth.helper';

export interface TestToolResources {
  brandId: string;
  categoryId: string;
  productId: string;
  stageId: string;
}

export interface TestLessonResources {
  brandId: string;
  productId: string;
}

export interface TestMakeupBagResources {
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
  data: TestMakeupBagQuestionnaire;
}

export interface StageResources {
  id: string;
  data: TestStage;
}

export interface StoreResources {
  id: string;
  data: TestStore;
}

export interface ToolResources {
  id: string;
  data: TestTool;
}

export class ResourceHelper {
  static async setupLessonResources(
    app: INestApplication,
    tokens: AuthTokens,
  ): Promise<TestLessonResources> {
    const category = await this.createCategory(app, tokens.adminToken);
    const brand = await this.createBrand(app, tokens.adminToken);

    const product = await this.createProduct(
      app,
      tokens.muaToken,
      tokens.muaId,
      brand.id,
      category.id,
    );

    return {
      brandId: brand.id,
      productId: product.id,
    };
  }

  static async setupMakeupBagResources(
    app: INestApplication,
    tokens: AuthTokens,
  ): Promise<TestMakeupBagResources> {
    const category = await this.createCategory(app, tokens.adminToken);
    const brand = await this.createBrand(app, tokens.adminToken);

    const product = await this.createProduct(
      app,
      tokens.muaToken,
      tokens.muaId,
      brand.id,
      category.id,
    );

    const stage = await this.createStage(app, tokens, [product.id]);

    const tool = await this.createTool(
      app,
      tokens.muaToken,
      tokens.muaId,
      brand.id,
    );

    return {
      brandId: brand.id,
      categoryId: category.id,
      productIds: [product.id],
      stageId: stage.id,
      toolId: tool.id,
    };
  }

  static async setupToolResources(
    app: INestApplication,
    tokens: AuthTokens,
  ): Promise<TestToolResources> {
    const brand = await this.createBrand(app, tokens.adminToken);
    const category = await this.createCategory(app, tokens.adminToken);

    const product = await this.createProduct(
      app,
      tokens.muaToken,
      tokens.muaId,
      brand.id,
      category.id,
    );

    const stage = await this.createStage(app, tokens, [product.id]);

    return {
      brandId: brand.id,
      categoryId: category.id,
      productId: product.id,
      stageId: stage.id,
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
    authorId: string,
    productIds: string[] = [],
    clientIds: string[] = [],
  ): Promise<LessonResources> {
    const data = TestDataFactory.createLesson(authorId, productIds, clientIds);

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
    authorId: string,
    productIds: string[] = [],
    clientIds: string[] = [],
  ): Promise<LessonResources[]> {
    const lessons: LessonResources[] = [];
    const lessonsData = TestDataFactory.createMultipleLessons(
      count,
      authorId,
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
    tokens: AuthTokens,
    categoryId: string,
    stageIds: string[] = [],
    toolIds: string[] = [],
  ): Promise<MakeupBagResources> {
    const data = TestDataFactory.createMakeupBag(
      tokens.muaId,
      categoryId,
      tokens.clientId,
      stageIds,
      toolIds,
    );

    const response = await request(app.getHttpServer())
      .post('/makeup-bags')
      .set('Authorization', `Bearer ${tokens.muaToken}`)
      .send(data)
      .expect(HttpStatus.CREATED);

    return {
      id: response.body.id,
      data,
    };
  }

  static async createProduct(
    app: INestApplication,
    token: string,
    authorId: string,
    brandId: string,
    categoryId: string,
  ): Promise<ProductResources> {
    const data = TestDataFactory.createProduct(authorId, brandId, categoryId);

    const response = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${token}`)
      .send(data)
      .expect(HttpStatus.CREATED);

    return {
      id: response.body.id,
      data,
    };
  }

  static async createMultipleProducts(
    app: INestApplication,
    tokens: AuthTokens,
    count: number,
    brandId: string,
    categoryId: string,
  ): Promise<ProductResources[]> {
    const products: ProductResources[] = [];
    const productsData = TestDataFactory.createMultipleProducts(
      count,
      tokens.muaId,
      brandId,
      categoryId,
    );

    for (const data of productsData) {
      const { body } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .send(data)
        .expect(HttpStatus.CREATED);

      products.push({ id: body.id, data });
    }

    return products;
  }

  static async createMakeupBagQuestionnaire(
    app: INestApplication,
    muaId: string,
  ): Promise<QuestionnaireResources> {
    const data = TestDataFactory.createMakeupBagQuestionnaire(muaId);

    const response = await request(app.getHttpServer())
      .post('/questionnaires/makeup-bags')
      .send(data)
      .expect(HttpStatus.CREATED);

    return {
      id: response.body.id,
      data,
    };
  }

  static async createStage(
    app: INestApplication,
    tokens: AuthTokens,
    productIds: string[],
  ): Promise<StageResources> {
    const data = TestDataFactory.createStage(tokens.muaId, productIds);

    const response = await request(app.getHttpServer())
      .post('/stages')
      .set('Authorization', `Bearer ${tokens.muaToken}`)
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
    authorId: string,
    productIds: string[],
  ): Promise<StageResources[]> {
    const stages: StageResources[] = [];
    const stagesData = TestDataFactory.createMultipleStages(
      count,
      authorId,
      productIds,
    );

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

  static async createStore(
    app: INestApplication,
    adminToken: string,
  ): Promise<StoreResources> {
    const data = TestDataFactory.createStore();

    const response = await request(app.getHttpServer())
      .post('/stores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(data)
      .expect(HttpStatus.CREATED);

    return {
      id: response.body.id,
      data,
    };
  }

  static async createMultipleStores(
    app: INestApplication,
    adminToken: string,
    count: number,
  ): Promise<StoreResources[]> {
    const stores: StoreResources[] = [];
    const storesData = TestDataFactory.createMultipleStores(count);

    for (const data of storesData) {
      const { body } = await request(app.getHttpServer())
        .post('/stores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data)
        .expect(HttpStatus.CREATED);

      stores.push({ id: body.id, data });
    }

    return stores;
  }

  static async createTool(
    app: INestApplication,
    adminToken: string,
    authorId: string,
    brandId: string,
  ): Promise<ToolResources> {
    const data = TestDataFactory.createTool(authorId, brandId);

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
