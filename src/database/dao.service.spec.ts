import { Test, TestingModule } from '@nestjs/testing';
import { DaoService } from './dao.service';
import * as fs from 'fs/promises';
import { join } from 'path';

jest.mock('fs/promises');

describe('DaoService', () => {
  let service: DaoService;
  const dbPath = join(process.cwd(), 'data', 'daos.json');
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DaoService],
    }).compile();

    service = module.get<DaoService>(DaoService);

    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock successful directory access
    mockFs.access.mockResolvedValue(undefined);

    // Mock successful file read with empty daos array
    mockFs.readFile.mockResolvedValue(JSON.stringify({ daos: [] }));

    // Mock successful file write
    mockFs.writeFile.mockResolvedValue(undefined);

    // Initialize the service
    await service.onModuleInit();
  });

  describe('initialization', () => {
    it('should create data directory if it does not exist', async () => {
      mockFs.access.mockRejectedValueOnce(new Error());

      await service.onModuleInit();

      expect(mockFs.mkdir).toHaveBeenCalledWith(join(process.cwd(), 'data'), {
        recursive: true,
      });
    });

    it('should create empty database file if it does not exist', async () => {
      mockFs.readFile.mockRejectedValueOnce(new Error());

      await service.onModuleInit();

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        dbPath,
        JSON.stringify({ daos: [] }, null, 2),
      );
    });
  });

  describe('addDao', () => {
    const validAddress = '0x742d35cc6634c0532925a3b844bc454e4438f44e';

    it('should add a new dao successfully', async () => {
      const result = await service.addDao(validAddress);

      expect(result.address).toBe(validAddress.toLowerCase());
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('should throw error for invalid ethereum address', async () => {
      const invalidAddress = 'invalid-address';

      await expect(service.addDao(invalidAddress)).rejects.toThrow(
        'Invalid Ethereum address format',
      );
    });

    it('should throw error for duplicate dao', async () => {
      // First addition
      await service.addDao(validAddress);

      // Second addition should fail
      await expect(service.addDao(validAddress)).rejects.toThrow(
        'DAO already exists',
      );
    });
  });

  describe('getDaos', () => {
    it('should return all daos', async () => {
      const validAddress = '0x742d35cc6634c0532925a3b844bc454e4438f44e';
      await service.addDao(validAddress);

      const result = await service.getDaos();

      expect(result).toHaveLength(1);
      expect(result[0].address).toBe(validAddress.toLowerCase());
    });

    it('should return empty array when no daos exist', async () => {
      const result = await service.getDaos();
      expect(result).toEqual([]);
    });
  });

  describe('getDaoByAddress', () => {
    const validAddress = '0x742d35cc6634c0532925a3b844bc454e4438f44e';

    it('should return dao if found', async () => {
      await service.addDao(validAddress);

      const result = await service.getDaoByAddress(validAddress);

      expect(result).toBeDefined();
      expect(result.address).toBe(validAddress.toLowerCase());
    });

    it('should return undefined if dao not found', async () => {
      const result = await service.getDaoByAddress(validAddress);
      expect(result).toBeUndefined();
    });

    it('should find dao regardless of address case', async () => {
      await service.addDao(validAddress);

      const result = await service.getDaoByAddress(validAddress.toUpperCase());

      expect(result).toBeDefined();
      expect(result.address).toBe(validAddress.toLowerCase());
    });
  });
});
