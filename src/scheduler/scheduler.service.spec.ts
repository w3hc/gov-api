import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerService } from './scheduler.service';
import { DaoService } from '../database/dao.service';

describe('SchedulerService', () => {
  let service: SchedulerService;
  let daoService: DaoService;

  const mockDaos = [
    { address: '0x123', createdAt: new Date() },
    { address: '0x456', createdAt: new Date() },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulerService,
        {
          provide: DaoService,
          useValue: {
            getDaos: jest.fn().mockResolvedValue(mockDaos),
            executeProposal: jest.fn().mockResolvedValue({
              success: true,
              proposalId: '123',
              transactionHash: '0xabc123',
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SchedulerService>(SchedulerService);
    daoService = module.get<DaoService>(DaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleExecuteProposals', () => {
    it('should process all DAOs', async () => {
      await service.handleExecuteProposals();

      expect(daoService.getDaos).toHaveBeenCalled();
      expect(daoService.executeProposal).toHaveBeenCalledTimes(2);
      expect(daoService.executeProposal).toHaveBeenCalledWith(
        mockDaos[0].address,
      );
      expect(daoService.executeProposal).toHaveBeenCalledWith(
        mockDaos[1].address,
      );
    });

    it('should continue processing if one DAO fails', async () => {
      jest
        .spyOn(daoService, 'executeProposal')
        .mockResolvedValueOnce({
          success: true,
          proposalId: '123',
          transactionHash: '0xabc123',
        })
        .mockRejectedValueOnce(new Error('Failed to execute'));

      await service.handleExecuteProposals();

      expect(daoService.executeProposal).toHaveBeenCalledTimes(2);
    });
  });
});
