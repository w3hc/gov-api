import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return health status', () => {
      const result = appController.healthCheck();
      expect(result.status).toBe('ok');
    });
  });

  describe('ping', () => {
    it('should return pong', () => {
      const result = appController.ping();
      expect(result.pong).toBe(true);
    });
  });
});
