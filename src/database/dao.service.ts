import { Injectable, OnModuleInit } from '@nestjs/common';
import { join } from 'path';
import * as fs from 'fs/promises';
import { Dao, DbSchema } from './schemas/dao.schema';
import { ethers } from 'ethers';

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

  async executeProposal(daoAddress: string) {
    // Validate address format
    if (!daoAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error('Invalid Ethereum address format');
    }

    // Check if DAO exists
    const dao = await this.getDaoByAddress(daoAddress);
    if (!dao) {
      throw new Error('DAO not found');
    }

    const provider = new ethers.JsonRpcProvider(
      process.env.OP_SEPOLIA_RPC_ENDPOINT_URL,
    );
    // console.log('process.env.PRIVATE_KEY', process.env.PRIVATE_KEY);
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const abi = [
      'function execute(address[] targets, uint[] values, bytes[] calldatas, bytes32 descriptionHash) external',
      'function state(uint256 proposalId) external view returns (uint8)',
      'event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)',
      'event ProposalExecuted(uint256 proposalId)',
    ];
    const gov = new ethers.Contract(daoAddress, abi, signer);

    try {
      const filter = gov.filters.ProposalCreated();

      // Get the current block and calculate range
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = currentBlock - 10000;

      // Query events with block range
      const events = await gov.queryFilter(filter, fromBlock, currentBlock);

      if (events.length === 0) {
        throw new Error('No proposals found');
      }

      // Get the most recent unexecuted proposal
      for (const event of events.reverse()) {
        const log = event as ethers.EventLog;
        if (!log.args) continue;

        const proposalId = log.args[0];
        const targets = Array.from(log.args[2]);
        const values = Array.from(log.args[3]);
        const calldatas = Array.from(log.args[5]);
        const description = log.args[8];

        console.log('proposalId', proposalId);

        console.log('targets', targets);
        console.log('values', values);
        console.log('calldatas', calldatas);
        console.log('description', description);

        // Check proposal state (4 is Succeeded)
        const state = await gov.state(proposalId);
        console.log('state', state);
        if (state !== 4) continue;

        // // Check if already executed
        // const executedFilter = gov.filters.ProposalExecuted(proposalId);
        // const executedEvents = await gov.queryFilter(executedFilter);
        // if (executedEvents.length > 0) continue;

        const descriptionHash = ethers.id(description);
        console.log('descriptionHash:', descriptionHash);

        // Execute the proposal
        const executeCall = await gov.execute(
          targets,
          values,
          calldatas,
          descriptionHash,
        );

        console.log('executeCall:', executeCall);

        const receipt = await executeCall.wait(1);
        return {
          success: true,
          proposalId: proposalId.toString(),
          transactionHash: receipt.hash,
        };
      }

      throw new Error('No executable proposals found');
    } catch (error) {
      throw new Error(`Failed to execute proposal: ${error.message}`);
    }
  }
}
