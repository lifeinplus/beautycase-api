import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection } from 'mongoose';
import * as request from 'supertest';

import { Budget } from 'src/common/enums/budget.enum';
import { MakeupTime } from 'src/common/enums/makeup-time.enum';
import { Referral } from 'src/common/enums/referral.enum';
import configuration from 'src/config/configuration';
import { AuthModule } from 'src/modules/auth/auth.module';
import { CreateQuestionnaireDto } from 'src/modules/questionnaires/dto/create-questionnaire.dto';
import { QuestionnairesModule } from 'src/modules/questionnaires/questionnaires.module';
import { Questionnaire } from 'src/modules/questionnaires/schemas/questionnaire.schema';
import { UsersModule } from 'src/modules/users/users.module';
import { AuthHelper, AuthTokens } from 'test/helpers/auth.helper';
import {
  DatabaseHelper,
  TestDatabaseModule,
} from 'test/helpers/database.helper';

describe('Questionnaires (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let tokens: AuthTokens;

  const mockQuestionnaire: CreateQuestionnaireDto = {
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
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
          envFilePath: '.env.test.local',
        }),
        TestDatabaseModule,
        AuthModule,
        QuestionnairesModule,
        UsersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    connection = moduleFixture.get<Connection>(getConnectionToken());

    await app.init();

    tokens = await AuthHelper.setupAuthTokens(app);
  });

  beforeEach(async () => {
    await DatabaseHelper.clearCollection(connection, 'questionnaires');
  });

  afterAll(async () => {
    await app.close();
    await DatabaseHelper.closeConnection();
  });

  describe('POST /questionnaires', () => {
    it('should create with all fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/questionnaires')
        .send(mockQuestionnaire)
        .expect(HttpStatus.CREATED);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        message: 'Questionnaire created successfully',
      });
    });

    it('should create with only required fields', async () => {
      const minimalDto = {
        name: 'John Smith',
        makeupBag: 'Simple makeup bag with basics',
      };

      const response = await request(app.getHttpServer())
        .post('/questionnaires')
        .send(minimalDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        message: 'Questionnaire created successfully',
      });
    });

    it('should create a questionnaire without photo URL', async () => {
      const dtoWithoutPhoto = {
        ...mockQuestionnaire,
        makeupBagPhotoUrl: undefined,
      };

      const response = await request(app.getHttpServer())
        .post('/questionnaires')
        .send(dtoWithoutPhoto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        message: 'Questionnaire created successfully',
      });
    });

    it('should fail when name is missing', async () => {
      const invalidDto = {
        makeupBag: 'my-makeup-bag-description',
      };

      await request(app.getHttpServer())
        .post('/questionnaires')
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail when makeupBag is missing', async () => {
      const invalidDto = {
        name: 'Jane Doe',
      };

      await request(app.getHttpServer())
        .post('/questionnaires')
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail when makeupBag is empty', async () => {
      const invalidDto = {
        name: 'Jane Doe',
        makeupBag: '',
      };

      await request(app.getHttpServer())
        .post('/questionnaires')
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);
    });
    it('should fail with invalid budget enum', async () => {
      const invalidDto = {
        ...mockQuestionnaire,
        budget: 'INVALID_BUDGET',
      };

      await request(app.getHttpServer())
        .post('/questionnaires')
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail with invalid makeupTime enum', async () => {
      const invalidDto = {
        ...mockQuestionnaire,
        makeupTime: 'INVALID_TIME',
      };

      await request(app.getHttpServer())
        .post('/questionnaires')
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail with invalid referral enum', async () => {
      const invalidDto = {
        ...mockQuestionnaire,
        referral: 'INVALID_REFERRAL',
      };

      await request(app.getHttpServer())
        .post('/questionnaires')
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail with invalid brushes value', async () => {
      const invalidDto = {
        ...mockQuestionnaire,
        brushes: 'maybe',
      };

      await request(app.getHttpServer())
        .post('/questionnaires')
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail with invalid age type', async () => {
      const invalidDto = {
        ...mockQuestionnaire,
        age: 'twenty-five',
      };

      await request(app.getHttpServer())
        .post('/questionnaires')
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail with invalid makeupBagPhotoUrl', async () => {
      const invalidDto = {
        ...mockQuestionnaire,
        makeupBagPhotoUrl: 'not-a-url',
      };

      await request(app.getHttpServer())
        .post('/questionnaires')
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail with invalid desiredSkills structure', async () => {
      const invalidDto = {
        ...mockQuestionnaire,
        desiredSkills: {
          bright: 'true', // should be boolean
          delicate: false,
        },
      };

      await request(app.getHttpServer())
        .post('/questionnaires')
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail with invalid problems structure', async () => {
      const invalidDto = {
        ...mockQuestionnaire,
        problems: {
          eyeshadowCrease: 'yes', // should be boolean
          foundationPores: true,
        },
      };

      await request(app.getHttpServer())
        .post('/questionnaires')
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail with invalid procedures structure', async () => {
      const invalidDto = {
        ...mockQuestionnaire,
        procedures: {
          browCorrection: 'no', // should be boolean
          lashExtensions: false,
        },
      };

      await request(app.getHttpServer())
        .post('/questionnaires')
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /questionnaires', () => {
    let questionnaireId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/questionnaires')
        .send(mockQuestionnaire);

      questionnaireId = response.body.id;
    });

    it('should get all questionnaires as admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/questionnaires')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('_id', questionnaireId);
      expect(response.body[0]).toHaveProperty('name', 'Jane Doe');
      expect(response.body[0]).toHaveProperty(
        'makeupBag',
        'my-makeup-bag-description',
      );
    });

    it('should get all questionnaires as MUA', async () => {
      const response = await request(app.getHttpServer())
        .get('/questionnaires')
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('_id', questionnaireId);
    });

    it('should reject access when authenticated as client', async () => {
      await request(app.getHttpServer())
        .get('/questionnaires')
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should reject access when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/questionnaires')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 404 when no questionnaires exist', async () => {
      await DatabaseHelper.clearCollection(connection, 'questionnaires');

      await request(app.getHttpServer())
        .get('/questionnaires')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should fail with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/questionnaires')
        .set('Authorization', 'Bearer invalid-token')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return multiple questionnaires', async () => {
      await request(app.getHttpServer())
        .post('/questionnaires')
        .send({ name: 'User 2', makeupBag: 'Bag 2' });

      await request(app.getHttpServer())
        .post('/questionnaires')
        .send({ name: 'User 3', makeupBag: 'Bag 3' });

      const response = await request(app.getHttpServer())
        .get('/questionnaires')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveLength(3);
      expect(response.body.map((q: Questionnaire) => q.name)).toContain(
        'Jane Doe',
      );
      expect(response.body.map((q: Questionnaire) => q.name)).toContain(
        'User 2',
      );
      expect(response.body.map((q: Questionnaire) => q.name)).toContain(
        'User 3',
      );
    });
  });

  describe('GET /questionnaires/:id', () => {
    let questionnaireId: string;

    beforeEach(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/questionnaires')
        .send(mockQuestionnaire)
        .expect(HttpStatus.CREATED);

      questionnaireId = createResponse.body.id;
    });

    it('should return questionnaire by id for admin user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/questionnaires/${questionnaireId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('_id', questionnaireId);
      expect(response.body).toHaveProperty('name', mockQuestionnaire.name);
      expect(response.body).toHaveProperty(
        'makeupBag',
        mockQuestionnaire.makeupBag,
      );
      expect(response.body).toHaveProperty('age', mockQuestionnaire.age);
      expect(response.body).toHaveProperty(
        'allergies',
        mockQuestionnaire.allergies,
      );
      expect(response.body).toHaveProperty('budget', mockQuestionnaire.budget);
      expect(response.body).toHaveProperty('city', mockQuestionnaire.city);
      expect(response.body).toHaveProperty(
        'skinType',
        mockQuestionnaire.skinType,
      );
      expect(response.body.desiredSkills).toEqual(
        mockQuestionnaire.desiredSkills,
      );
      expect(response.body.problems).toEqual(mockQuestionnaire.problems);
      expect(response.body.procedures).toEqual(mockQuestionnaire.procedures);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should return questionnaire by id for MUA user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/questionnaires/${questionnaireId}`)
        .set('Authorization', `Bearer ${tokens.muaToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('_id', questionnaireId);
      expect(response.body).toHaveProperty('name', mockQuestionnaire.name);
    });

    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .get(`/questionnaires/${questionnaireId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should fail for client user (insufficient privileges)', async () => {
      await request(app.getHttpServer())
        .get(`/questionnaires/${questionnaireId}`)
        .set('Authorization', `Bearer ${tokens.clientToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 404 for non-existent questionnaire', async () => {
      const fakeId = '507f1f77bcf86cd799439999';

      await request(app.getHttpServer())
        .get(`/questionnaires/${fakeId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should validate MongoDB ObjectId format', async () => {
      await request(app.getHttpServer())
        .get('/questionnaires/invalid-id')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail with invalid token', async () => {
      await request(app.getHttpServer())
        .get(`/questionnaires/${questionnaireId}`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Integration scenarios', () => {
    it('should create and retrieve questionnaire with complete workflow', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/questionnaires')
        .send(mockQuestionnaire)
        .expect(HttpStatus.CREATED);

      const questionnaireId = createResponse.body.id;
      expect(questionnaireId).toBeDefined();

      const getOneResponse = await request(app.getHttpServer())
        .get(`/questionnaires/${questionnaireId}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.OK);

      expect(getOneResponse.body._id).toBe(questionnaireId);
      expect(getOneResponse.body.name).toBe(mockQuestionnaire.name);
      expect(getOneResponse.body.budget).toBe(mockQuestionnaire.budget);

      const getAllResponse = await request(app.getHttpServer())
        .get('/questionnaires')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.OK);

      expect(getAllResponse.body).toHaveLength(1);
      expect(getAllResponse.body[0]._id).toBe(questionnaireId);
    });

    it('should handle multiple questionnaires correctly', async () => {
      const questionnaires: CreateQuestionnaireDto[] = [
        { name: 'User A', makeupBag: 'Bag A', age: 20 },
        { name: 'User B', makeupBag: 'Bag B', age: 25 },
        { name: 'User C', makeupBag: 'Bag C', age: 30 },
      ];

      const createdIds: string[] = [];

      for (const questionnaire of questionnaires) {
        const postResponse = await request(app.getHttpServer())
          .post('/questionnaires')
          .send(questionnaire)
          .expect(HttpStatus.CREATED);

        createdIds.push(postResponse.body.id);
      }

      const getAllResponse = await request(app.getHttpServer())
        .get('/questionnaires')
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .expect(HttpStatus.OK);

      expect(getAllResponse.body).toHaveLength(3);

      const names = getAllResponse.body.map((q: Questionnaire) => q.name);
      expect(names).toContain('User A');
      expect(names).toContain('User B');
      expect(names).toContain('User C');

      for (const id of createdIds) {
        await request(app.getHttpServer())
          .get(`/questionnaires/${id}`)
          .set('Authorization', `Bearer ${tokens.adminToken}`)
          .expect(HttpStatus.OK);
      }
    });

    it('should properly validate enum fields', async () => {
      const validEnumValues: CreateQuestionnaireDto = {
        name: 'Enum Test User',
        makeupBag: 'Test bag',
        budget: Budget.MEDIUM,
        makeupTime: MakeupTime.LONG,
        referral: Referral.INSTAGRAM,
      };

      await request(app.getHttpServer())
        .post('/questionnaires')
        .send(validEnumValues)
        .expect(HttpStatus.CREATED);

      const invalidBudget = { ...validEnumValues, budget: 'INVALID' };
      await request(app.getHttpServer())
        .post('/questionnaires')
        .send(invalidBudget)
        .expect(HttpStatus.BAD_REQUEST);

      const invalidMakeupTime = { ...validEnumValues, makeupTime: 'INVALID' };
      await request(app.getHttpServer())
        .post('/questionnaires')
        .send(invalidMakeupTime)
        .expect(HttpStatus.BAD_REQUEST);

      const invalidReferral = { ...validEnumValues, referral: 'INVALID' };
      await request(app.getHttpServer())
        .post('/questionnaires')
        .send(invalidReferral)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
});
