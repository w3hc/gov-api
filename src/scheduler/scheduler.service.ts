import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DaoService } from '../database/dao.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly daoService: DaoService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExecuteProposals() {
    this.logger.log('Starting daily proposal execution for all DAOs');

    try {
      const daos = await this.daoService.getDaos();

      for (const dao of daos) {
        try {
          this.logger.log(`Processing DAO: ${dao.address}`);
          await this.daoService.executeProposal(dao.address);
          this.logger.log(`Successfully processed DAO: ${dao.address}`);
        } catch (error) {
          // Log error but continue processing other DAOs
          this.logger.error(
            `Error processing DAO ${dao.address}: ${error.message}`,
          );
        }
      }

      this.logger.log('Completed daily proposal execution for all DAOs');
    } catch (error) {
      this.logger.error('Failed to execute daily proposals:', error);
    }
  }
}
