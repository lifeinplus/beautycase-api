import { HttpStatus, INestApplication } from '@nestjs/common';
import { Types } from 'mongoose';
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

export interface TestToolResources {
  brandId: Types.ObjectId;
  categoryId: Types.ObjectId;
  productId: Types.ObjectId;
  stageId: Types.ObjectId;
}

export interface TestLessonResources {
  brandId: Types.ObjectId;
  productId: Types.ObjectId;
}

export interface TestMakeupBagResources {
  brandId: Types.ObjectId;
  categoryId: Types.ObjectId;
  productIds: Types.ObjectId[];
  stageId: Types.ObjectId;
  toolId: Types.ObjectId;
}

export interface BrandResources {
  id: Types.ObjectId;
  data: TestBrand;
}

export interface CategoryResources {
  id: Types.ObjectId;
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
  id: Types.ObjectId;
  data: TestProduct;
}

export interface QuestionnaireResources {
  id: string;
  data: TestMakeupBagQuestionnaire;
}

export interface StageResources {
  id: Types.ObjectId;
  data: TestStage;
}

export interface StoreResources {
  id: string;
  data: TestStore;
}

export interface ToolResources {
  id: Types.ObjectId;
  data: TestTool;
}

export class ResourceHelper {
  static async setupLessonResources(
    app: INestApplication,
    adminToken: string,
  ): Promise<TestLessonResources> {
    const category = await this.createCategory(app, adminToken);
    const brand = await this.createBrand(app, adminToken);
    const product = await this.createProduct(
      app,
      adminToken,
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
    adminToken: string,
  ): Promise<TestMakeupBagResources> {
    const category = await this.createCategory(app, adminToken);
    const brand = await this.createBrand(app, adminToken);
    const product = await this.createProduct(
      app,
      adminToken,
      brand.id,
      category.id,
    );
    const stage = await this.createStage(app, adminToken, [product.id]);
    const tool = await this.createTool(app, adminToken, brand.id);

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
    adminToken: string,
  ): Promise<TestToolResources> {
    const brand = await this.createBrand(app, adminToken);
    const category = await this.createCategory(app, adminToken);

    const product = await this.createProduct(
      app,
      adminToken,
      brand.id,
      category.id,
    );

    const stage = await this.createStage(app, adminToken, [product.id]);

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
    productIds: Types.ObjectId[] = [],
    clientIds: Types.ObjectId[] = [],
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
    productIds: Types.ObjectId[] = [],
    clientIds: Types.ObjectId[] = [],
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
    categoryId: Types.ObjectId,
    clientId: Types.ObjectId,
    stageIds: Types.ObjectId[] = [],
    toolIds: Types.ObjectId[] = [],
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
    brandId: Types.ObjectId,
    categoryId: Types.ObjectId,
  ): Promise<ProductResources> {
    const data = TestDataFactory.createProduct(brandId, categoryId);

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
    brandId: Types.ObjectId,
    categoryId: Types.ObjectId,
  ): Promise<ProductResources[]> {
    const products: ProductResources[] = [];
    const productsData = TestDataFactory.createMultipleProducts(
      count,
      brandId,
      categoryId,
    );

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
    const data = TestDataFactory.createMakeupBagQuestionnaire();

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
    adminToken: string,
    productIds: Types.ObjectId[],
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
    productIds: Types.ObjectId[],
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
    brandId: Types.ObjectId,
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
