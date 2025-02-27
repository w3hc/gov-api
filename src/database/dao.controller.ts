import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DaoService } from './dao.service';
import { Dao } from './schemas/dao.schema';
import { CreateDaoDto } from './dto/create-dao.dto';

@Controller('daos')
@ApiTags('daos')
export class DaoController {
  constructor(private readonly daoService: DaoService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new DAO' })
  @ApiResponse({
    status: 201,
    description: 'The DAO has been successfully added.',
    type: CreateDaoDto,
  })
  async addDao(@Body() createDaoDto: CreateDaoDto): Promise<Dao> {
    try {
      return await this.daoService.addDao(createDaoDto.address);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all DAOs' })
  @ApiResponse({
    status: 200,
    description: 'Returns all DAOs',
    type: [CreateDaoDto],
  })
  async getAllDaos(): Promise<Dao[]> {
    return this.daoService.getDaos();
  }

  @Get(':address')
  @ApiOperation({ summary: 'Get a DAO by address' })
  @ApiResponse({
    status: 200,
    description: 'Returns the DAO if found',
    type: CreateDaoDto,
  })
  async getDaoByAddress(@Param('address') address: string): Promise<Dao> {
    const dao = await this.daoService.getDaoByAddress(address);
    if (!dao) {
      throw new BadRequestException('DAO not found');
    }
    return dao;
  }

  @Post(':address/execute')
  @ApiOperation({
    summary: 'Execute a succeeded proposal for the specified DAO',
  })
  @ApiResponse({
    status: 200,
    description: 'Proposal executed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        proposalId: { type: 'string' },
        transactionHash: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - Invalid address, no executable proposals, or execution failed',
  })
  async executeProposal(@Param('address') address: string) {
    try {
      const result = await this.daoService.executeProposal(address);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
