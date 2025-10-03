import { Types } from 'mongoose';
import { Budget } from 'src/common/enums/budget.enum';
import { MakeupTime } from 'src/common/enums/makeup-time.enum';
import { Referral } from 'src/common/enums/referral.enum';
import { CreateBrandDto } from 'src/modules/brands/dto/create-brand.dto';
import { CreateCategoryDto } from 'src/modules/categories/dto/create-category.dto';
import { CreateLessonDto } from 'src/modules/lessons/dto/create-lesson.dto';
import { CreateMakeupBagDto } from 'src/modules/makeup-bags/dto/create-makeup-bag.dto';
import { CreateProductDto } from 'src/modules/products/dto/create-product.dto';
import { CreateMakeupBagQuestionnaireDto } from 'src/modules/questionnaires/dto/create-makeup-bag-questionnaire.dto';
import { CreateStageDto } from 'src/modules/stages/dto/create-stage.dto';
import { CreateStoreDto } from 'src/modules/stores/dto/create-store.dto';
import { CreateToolDto } from 'src/modules/tools/dto/create-tool.dto';
import { CreateUserDto } from 'src/modules/users/dto/create-user.dto';

export interface TestBrand extends CreateBrandDto {}
export interface TestCategory extends CreateCategoryDto {}
export interface TestLesson extends CreateLessonDto {}
export interface TestMakeupBag extends CreateMakeupBagDto {}
export interface TestProduct extends CreateProductDto {}
export interface TestQuestionnaire extends CreateMakeupBagQuestionnaireDto {}
export interface TestStage extends CreateStageDto {}
export interface TestStore extends CreateStoreDto {}
export interface TestTool extends CreateToolDto {}
export interface TestUser extends CreateUserDto {}

export class TestDataFactory {
  static createAdminUser(overrides: Partial<TestUser> = {}): TestUser {
    return {
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      ...overrides,
    };
  }

  static createMuaUser(overrides: Partial<TestUser> = {}): TestUser {
    return {
      username: 'mua',
      password: 'mua123',
      role: 'mua',
      ...overrides,
    };
  }

  static createClientUser(overrides: Partial<TestUser> = {}): TestUser {
    return {
      username: 'client',
      password: 'client123',
      role: 'client',
      ...overrides,
    };
  }

  static createMultipleClientUsers(count: number): TestUser[] {
    return Array.from({ length: count }, (_, index) =>
      this.createClientUser({
        username: `client${index + 1}`,
      }),
    );
  }

  static createBrand(overrides: Partial<TestBrand> = {}): TestBrand {
    return {
      name: 'Test Brand',
      ...overrides,
    };
  }

  static createMultipleBrands(count: number): TestBrand[] {
    return Array.from({ length: count }, (_, index) =>
      this.createBrand({
        name: `Test Brand ${index + 1}`,
      }),
    );
  }

  static createCategory(overrides: Partial<TestCategory> = {}): TestCategory {
    return {
      name: 'basic',
      type: 'makeup_bag',
      ...overrides,
    };
  }

  static createMultipleCategories(count: number): TestCategory[] {
    return Array.from({ length: count }, (_, index) =>
      this.createCategory({
        name: `category ${index + 1}`,
      }),
    );
  }

  static createLesson(
    productIds: Types.ObjectId[] = [],
    clientIds: Types.ObjectId[] = [],
    overrides: Partial<TestLesson> = {},
  ): TestLesson {
    return {
      title: 'Advanced Makeup Techniques',
      shortDescription: 'Learn advanced makeup application methods',
      videoUrl: 'https://example.com/video.mp4',
      fullDescription: 'This lesson covers advanced makeup techniques',
      productIds,
      clientIds,
      ...overrides,
    };
  }

  static createMultipleLessons(
    count: number,
    productIds: Types.ObjectId[] = [],
    clientIds: Types.ObjectId[] = [],
  ): TestLesson[] {
    return Array.from({ length: count }, (_, index) =>
      this.createLesson(productIds, clientIds, {
        title: `Lesson ${index + 1}`,
      }),
    );
  }

  static createMakeupBag(
    categoryId: Types.ObjectId,
    clientId: Types.ObjectId,
    stageIds: Types.ObjectId[] = [],
    toolIds: Types.ObjectId[] = [],
    overrides: Partial<TestMakeupBag> = {},
  ): TestMakeupBag {
    return {
      categoryId,
      clientId,
      stageIds,
      toolIds,
      ...overrides,
    };
  }

  static createProduct(
    brandId: Types.ObjectId,
    categoryId: Types.ObjectId,
    overrides: Partial<TestProduct> = {},
  ): TestProduct {
    return {
      brandId,
      categoryId,
      name: 'Test Lipstick',
      imageUrl: 'https://example.com/lipstick.jpg',
      comment: 'A beautiful red lipstick perfect for evening wear',
      shade: 'Ruby Red',
      storeLinks: [
        {
          name: 'Sephora',
          link: 'https://sephora.com/product/test-lipstick',
        },
      ],
      ...overrides,
    };
  }

  static createMultipleProducts(
    count: number,
    brandId: Types.ObjectId,
    categoryId: Types.ObjectId,
  ): TestProduct[] {
    return Array.from({ length: count }, (_, index) =>
      this.createProduct(brandId, categoryId, {
        name: `Test Product ${index + 1}`,
      }),
    );
  }

  static createQuestionnaire(
    overrides: Partial<TestQuestionnaire> = {},
  ): TestQuestionnaire {
    return {
      name: 'Jane Doe',
      makeupBag: 'my-makeup-bag-description',
      age: 25,
      allergies: 'None',
      budget: Budget.MEDIUM,
      brushes: 'yes',
      city: 'New York',
      currentSkills: 'Basic makeup application',
      desiredSkills: {
        bright: true,
        delicate: false,
        evening: true,
        office: false,
        filming: false,
      },
      instagram: '@janedoe',
      makeupBagPhotoUrl: 'https://example.com/photo.jpg',
      makeupTime: MakeupTime.LONG,
      oilyShine: 'T-zone only',
      peeling: 'No',
      pores: 'Visible on nose',
      problems: {
        eyeshadowCrease: true,
        eyeshadowMatch: false,
        foundationPores: true,
        foundationStay: false,
        mascaraSmudge: true,
        sculpting: false,
      },
      procedures: {
        browCorrection: true,
        lashExtensions: false,
        lashLamination: true,
        none: false,
      },
      referral: Referral.INSTAGRAM,
      skinType: 'Combination',
      ...overrides,
    };
  }

  static createStage(
    productIds: Types.ObjectId[] = [],
    overrides: Partial<TestStage> = {},
  ): TestStage {
    return {
      title: 'Morning routine',
      subtitle: 'Soft and natural',
      imageUrl: 'http://example.com/image.jpg',
      productIds,
      ...overrides,
    };
  }

  static createMultipleStages(
    count: number,
    productIds: Types.ObjectId[],
  ): TestStage[] {
    return Array.from({ length: count }, (_, index) =>
      this.createStage(productIds, {
        title: `Test Stage ${index + 1}`,
      }),
    );
  }

  static createStore(overrides: Partial<TestStore> = {}): TestStore {
    return {
      name: 'Test Store',
      ...overrides,
    };
  }

  static createMultipleStores(count: number): TestStore[] {
    return Array.from({ length: count }, (_, index) =>
      this.createStore({
        name: `Test Store ${index + 1}`,
      }),
    );
  }

  static createTool(
    brandId: Types.ObjectId,
    overrides: Partial<TestTool> = {},
  ): TestTool {
    return {
      brandId,
      name: 'Brush',
      imageUrl: 'http://example.com/image.jpg',
      comment: 'Great tool',
      storeLinks: [],
      ...overrides,
    };
  }
}
