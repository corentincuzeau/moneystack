import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let prismaService: PrismaService;

  const mockPrismaService = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('check', () => {
    it('should return healthy status when database is connected', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const result = await controller.check();

      expect(result.status).toBe('ok');
      expect(result.services.database).toBe('ok');
      expect(result.services.api).toBe('ok');
      expect(result.timestamp).toBeDefined();
    });

    it('should return error status when database is disconnected', async () => {
      mockPrismaService.$queryRaw.mockRejectedValue(new Error('Connection failed'));

      const result = await controller.check();

      expect(result.status).toBe('error');
      expect(result.services.database).toBe('error');
      expect(result.services.api).toBe('ok');
    });
  });

  describe('live', () => {
    it('should return ok status', () => {
      const result = controller.live();

      expect(result.status).toBe('ok');
    });
  });

  describe('ready', () => {
    it('should return ready when database is connected', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const result = await controller.ready();

      expect(result.status).toBe('ok');
      expect(result.ready).toBe(true);
    });

    it('should return not ready when database is disconnected', async () => {
      mockPrismaService.$queryRaw.mockRejectedValue(new Error('Connection failed'));

      const result = await controller.ready();

      expect(result.status).toBe('error');
      expect(result.ready).toBe(false);
    });
  });
});
