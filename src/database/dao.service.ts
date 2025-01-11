import { Injectable, OnModuleInit } from '@nestjs/common';
import { join } from 'path';
import * as fs from 'fs/promises';
import { Dao, DbSchema } from './schemas/dao.schema';

@Injectable()
export class DaoService implements OnModuleInit {
  private dbPath: string;
  private data: DbSchema;

  constructor() {
    this.dbPath = join(process.cwd(), 'data', 'daos.json');
    this.data = { daos: [] };
  }

  async onModuleInit() {
    await this.initDb();
  }

  private async initDb() {
    try {
      const dataDir = join(process.cwd(), 'data');
      try {
        await fs.access(dataDir);
      } catch {
        await fs.mkdir(dataDir, { recursive: true });
      }

      try {
        const fileContent = await fs.readFile(this.dbPath, 'utf-8');
        this.data = JSON.parse(fileContent);
      } catch {
        this.data = { daos: [] };
        await this.saveData();
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async saveData(): Promise<void> {
    await fs.writeFile(this.dbPath, JSON.stringify(this.data, null, 2));
  }

  async addDao(address: string): Promise<Dao> {
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error('Invalid Ethereum address format');
    }

    const existingDao = this.data.daos.find(
      (dao) => dao.address.toLowerCase() === address.toLowerCase(),
    );
    if (existingDao) {
      throw new Error('DAO already exists');
    }

    const newDao: Dao = {
      address: address.toLowerCase(),
      createdAt: new Date(),
    };

    this.data.daos.push(newDao);
    await this.saveData();
    return newDao;
  }

  async getDaos(): Promise<Dao[]> {
    return this.data.daos;
  }

  async getDaoByAddress(address: string): Promise<Dao | undefined> {
    return this.data.daos.find(
      (dao) => dao.address.toLowerCase() === address.toLowerCase(),
    );
  }
}
