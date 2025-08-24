import { CreateBrandDto } from 'src/modules/brands/dto/create-brand.dto';
import { CreateCategoryDto } from 'src/modules/categories/dto/create-category.dto';
import { CreateMakeupBagDto } from 'src/modules/makeup-bags/dto/create-makeup-bag.dto';
import { CreateProductDto } from 'src/modules/products/dto/create-product.dto';
import { CreateStageDto } from 'src/modules/stages/dto/create-stage.dto';
import { CreateToolDto } from 'src/modules/tools/dto/create-tool.dto';
import { Role } from 'src/modules/users/schemas/user.schema';

export interface TestUser {
  username: string;
  password: string;
  role: Role;
}

export interface TestBrand extends CreateBrandDto {}
export interface TestCategory extends CreateCategoryDto {}
export interface TestMakeupBag extends CreateMakeupBagDto {}
export interface TestProduct extends CreateProductDto {}
export interface TestStage extends CreateStageDto {}
export interface TestTool extends CreateToolDto {}

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

  static createBrand(overrides: Partial<TestBrand> = {}): TestBrand {
    return {
      name: 'Test Brand',
      ...overrides,
    };
  }

  static createCategory(overrides: Partial<TestCategory> = {}): TestCategory {
    return {
      name: 'basic',
      type: 'makeup_bag',
      ...overrides,
    };
  }

  static createMakeupBag(
    categoryId: string,
    clientId: string,
    stageIds: string[] = [],
    toolIds: string[] = [],
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
    brandId: string,
    overrides: Partial<TestProduct> = {},
  ): TestProduct {
    return {
      brandId,
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

  static createStage(
    productIds: string[] = [],
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

  static createTool(
    brandId: string,
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
