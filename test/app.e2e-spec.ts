import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as fs from 'fs/promises';
import { join } from 'path';

describe('DaoController (e2e)', () => {
  let app: INestApplication;
  const dataDir = join(process.cwd(), 'data');
  const dbPath = join(dataDir, 'daos.json');
  const validAddress = '0x742d35cc6634c0532925a3b844bc454e4438f44e';
  const invalidAddress = 'invalid-address';

  beforeAll(async () => {
    // Ensure data directory exists
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }
  });

  beforeEach(async () => {
    // Reset database before each test
    try {
      await fs.writeFile(dbPath, JSON.stringify({ daos: [] }, null, 2), {
        flag: 'w',
      });
    } catch (error) {
      console.error('Failed to reset database:', error);
      throw error;
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('/daos (POST)', () => {
    it('should create a new DAO with valid address', async () => {
      const response = await request(app.getHttpServer())
        .post('/daos')
        .send({ address: validAddress });

      expect(response.status).toBe(201);
      expect(response.body.address).toBe(validAddress.toLowerCase());
      expect(response.body.createdAt).toBeDefined();
    });

    it('should fail to create DAO with invalid address format', () => {
      return request(app.getHttpServer())
        .post('/daos')
        .send({ address: invalidAddress })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid Ethereum address format');
        });
    });

    it('should prevent duplicate DAO creation', async () => {
      // First creation should succeed
      await request(app.getHttpServer())
        .post('/daos')
        .send({ address: validAddress })
        .expect(201);

      // Second creation should fail
      return request(app.getHttpServer())
        .post('/daos')
        .send({ address: validAddress })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('DAO already exists');
        });
    });
  });

  describe('/daos (GET)', () => {
    it('should return empty array when no DAOs exist', async () => {
      const response = await request(app.getHttpServer()).get('/daos');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return array of DAOs after creation', async () => {
      // Create a DAO first
      await request(app.getHttpServer())
        .post('/daos')
        .send({ address: validAddress })
        .expect(201);

      // Then get all DAOs
      const response = await request(app.getHttpServer()).get('/daos');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].address).toBe(validAddress.toLowerCase());
    });
  });

  describe('/daos/:address (GET)', () => {
    it('should return DAO by address', async () => {
      // Create a DAO first
      await request(app.getHttpServer())
        .post('/daos')
        .send({ address: validAddress })
        .expect(201);

      // Then get it by address
      return request(app.getHttpServer())
        .get(`/daos/${validAddress}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.address).toBe(validAddress.toLowerCase());
          expect(res.body.createdAt).toBeDefined();
        });
    });

    it('should return 400 when DAO not found', () => {
      return request(app.getHttpServer())
        .get(`/daos/${validAddress}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('DAO not found');
        });
    });
  });

  afterEach(async () => {
    // Clean up after each test
    try {
      await fs.writeFile(dbPath, JSON.stringify({ daos: [] }, null, 2), {
        flag: 'w',
      });
    } catch (error) {
      console.error('Failed to clean up database:', error);
    }
    await app.close();
  });

  afterAll(async () => {
    try {
      await fs.writeFile(dbPath, JSON.stringify({ daos: [] }, null, 2), {
        flag: 'w',
      });
    } catch (error) {
      console.error('Failed to reset database after all tests:', error);
    }
  });
});
