import { Test, TestingModule } from '@nestjs/testing';
import { DaoController } from './dao.controller';
import { DaoService } from './dao.service';
import { BadRequestException } from '@nestjs/common';

describe('DaoController', () => {
  let controller: DaoController;
  let service: DaoService;

  const mockDao = {
    address: '0x742d35cc6634c0532925a3b844bc454e4438f44e',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DaoController],
      providers: [
        {
          provide: DaoService,
          useValue: {
            addDao: jest.fn(),
            getDaos: jest.fn(),
            getDaoByAddress: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DaoController>(DaoController);
    service = module.get<DaoService>(DaoService);
  });

  describe('addDao', () => {
    it('should successfully add a dao', async () => {
      jest.spyOn(service, 'addDao').mockResolvedValue(mockDao);

      const result = await controller.addDao({ address: mockDao.address });
      expect(result).toEqual(mockDao);
      expect(service.addDao).toHaveBeenCalledWith(mockDao.address);
    });

    it('should throw BadRequestException when service throws error', async () => {
      jest
        .spyOn(service, 'addDao')
        .mockRejectedValue(new Error('DAO already exists'));

      await expect(
        controller.addDao({ address: mockDao.address }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAllDaos', () => {
    it('should return array of daos', async () => {
      const daos = [mockDao];
      jest.spyOn(service, 'getDaos').mockResolvedValue(daos);

      const result = await controller.getAllDaos();
      expect(result).toEqual(daos);
      expect(service.getDaos).toHaveBeenCalled();
    });
  });

  describe('getDaoByAddress', () => {
    it('should return a dao if found', async () => {
      jest.spyOn(service, 'getDaoByAddress').mockResolvedValue(mockDao);

      const result = await controller.getDaoByAddress(mockDao.address);
      expect(result).toEqual(mockDao);
      expect(service.getDaoByAddress).toHaveBeenCalledWith(mockDao.address);
    });

    it('should throw BadRequestException if dao not found', async () => {
      jest.spyOn(service, 'getDaoByAddress').mockResolvedValue(undefined);

      await expect(controller.getDaoByAddress(mockDao.address)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
