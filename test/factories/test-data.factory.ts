import { Budget } from 'src/common/enums/budget.enum';
import { MakeupTime } from 'src/common/enums/makeup-time.enum';
import { Referral } from 'src/common/enums/referral.enum';
import { Role } from 'src/common/enums/role.enum';
import { CreateBrandDto } from 'src/modules/brands/dto/create-brand.dto';
import { CreateCategoryDto } from 'src/modules/categories/dto/create-category.dto';
import { CreateLessonDto } from 'src/modules/lessons/dto/create-lesson.dto';
import { CreateMakeupBagDto } from 'src/modules/makeup-bags/dto/create-makeup-bag.dto';
import { CreateProductDto } from 'src/modules/products/dto/create-product.dto';
import { CreateMakeupBagQuestionnaireDto } from 'src/modules/questionnaires/dto/create-makeup-bag-questionnaire.dto';
import { CreateTrainingQuestionnaireDto } from 'src/modules/questionnaires/dto/create-training-questionnaire.dto';
import { CreateStageDto } from 'src/modules/stages/dto/create-stage.dto';
import { CreateStoreDto } from 'src/modules/stores/dto/create-store.dto';
import { CreateToolDto } from 'src/modules/tools/dto/create-tool.dto';
import { CreateUserDto } from 'src/modules/users/dto/create-user.dto';

export interface TestBrand extends CreateBrandDto {}
export interface TestCategory extends CreateCategoryDto {}
export interface TestLesson extends CreateLessonDto {}
export interface TestMakeupBag extends CreateMakeupBagDto {}
export interface TestProduct extends CreateProductDto {}
export interface TestMakeupBagQuestionnaire
  extends CreateMakeupBagQuestionnaireDto {}
export interface TestTrainingQuestionnaire
  extends CreateTrainingQuestionnaireDto {}
export interface TestStage extends CreateStageDto {}
export interface TestStore extends CreateStoreDto {}
export interface TestTool extends CreateToolDto {}
export interface TestUser extends CreateUserDto {}

export class TestDataFactory {
  static createAdminUser(overrides: Partial<TestUser> = {}): TestUser {
    return {
      firstName: 'Admin',
      lastName: 'User',
      username: 'admin',
      password: 'admin123',
      role: Role.ADMIN,
      ...overrides,
    };
  }

  static createMuaUser(overrides: Partial<TestUser> = {}): TestUser {
    return {
      firstName: 'MUA',
      lastName: 'User',
      username: 'mua',
      password: 'mua123',
      role: Role.MUA,
      ...overrides,
    };
  }

  static createClientUser(overrides: Partial<TestUser> = {}): TestUser {
    return {
      firstName: 'Client',
      lastName: 'User',
      username: 'client',
      password: 'client123',
      role: Role.CLIENT,
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
    authorId: string,
    productIds: string[] = [],
    clientIds: string[] = [],
    overrides: Partial<TestLesson> = {},
  ): TestLesson {
    return {
      authorId,
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
    authorId: string,
    productIds: string[] = [],
    clientIds: string[] = [],
  ): TestLesson[] {
    return Array.from({ length: count }, (_, index) =>
      this.createLesson(authorId, productIds, clientIds, {
        title: `Lesson ${index + 1}`,
      }),
    );
  }

  static createMakeupBag(
    authorId: string,
    categoryId: string,
    clientId: string,
    stageIds: string[] = [],
    toolIds: string[] = [],
    overrides: Partial<TestMakeupBag> = {},
  ): TestMakeupBag {
    return {
      authorId,
      categoryId,
      clientId,
      stageIds,
      toolIds,
      ...overrides,
    };
  }

  static createProduct(
    authorId: string,
    brandId: string,
    categoryId: string,
    overrides: Partial<TestProduct> = {},
  ): TestProduct {
    return {
      authorId,
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
    authorId: string,
    brandId: string,
    categoryId: string,
  ): TestProduct[] {
    return Array.from({ length: count }, (_, index) =>
      this.createProduct(authorId, brandId, categoryId, {
        name: `Test Product ${index + 1}`,
      }),
    );
  }

  static createMakeupBagQuestionnaire(
    muaId: string,
    overrides: Partial<TestMakeupBagQuestionnaire> = {},
  ): TestMakeupBagQuestionnaire {
    return {
      muaId,
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

  static createTrainingQuestionnaire(
    muaId: string,
    overrides: Partial<TestTrainingQuestionnaire> = {},
  ): TestTrainingQuestionnaire {
    return {
      muaId,
      name: 'Jane Doe',
      contact: 'janedoe',
      difficulties: 'Struggling with smokey eye looks',
      expectations: 'Learn advanced techniques',
      experience: 'Intermediate',
      ...overrides,
    };
  }

  static createStage(
    authorId: string,
    productIds: string[] = [],
    overrides: Partial<TestStage> = {},
  ): TestStage {
    return {
      authorId,
      title: 'Morning routine',
      subtitle: 'Soft and natural',
      imageUrl: 'http://example.com/image.jpg',
      productIds,
      ...overrides,
    };
  }

  static createMultipleStages(
    count: number,
    authorId: string,
    productIds: string[],
  ): TestStage[] {
    return Array.from({ length: count }, (_, index) =>
      this.createStage(authorId, productIds, {
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
    authorId: string,
    brandId: string,
    overrides: Partial<TestTool> = {},
  ): TestTool {
    return {
      authorId,
      brandId,
      name: 'Brush',
      imageUrl: 'http://example.com/image.jpg',
      comment: 'Great tool',
      storeLinks: [],
      ...overrides,
    };
  }
}
