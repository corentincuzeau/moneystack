import { Test, TestingModule } from '@nestjs/testing';
import { AccountsService } from './accounts.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { AccountType } from '@prisma/client';

describe('AccountsService', () => {
  let service: AccountsService;
  let prismaService: PrismaService;

  const mockUserId = 'user-123';
  const mockAccount = {
    id: 'account-123',
    userId: mockUserId,
    name: 'Test Account',
    type: AccountType.CHECKING,
    balance: 1000,
    color: '#3B82F6',
    icon: 'wallet',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    account: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an account', async () => {
      const createDto = {
        name: 'New Account',
        type: AccountType.CHECKING,
        balance: 500,
        color: '#10B981',
        icon: 'wallet',
        isDefault: false,
      };

      mockPrismaService.account.create.mockResolvedValue({
        ...createDto,
        id: 'new-account-id',
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create(mockUserId, createDto);

      expect(result.name).toBe(createDto.name);
      expect(result.userId).toBe(mockUserId);
      expect(mockPrismaService.account.create).toHaveBeenCalledWith({
        data: { ...createDto, userId: mockUserId },
      });
    });

    it('should set other accounts as non-default when creating a default account', async () => {
      const createDto = {
        name: 'Default Account',
        type: AccountType.CHECKING,
        balance: 0,
        isDefault: true,
      };

      mockPrismaService.account.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.account.create.mockResolvedValue({
        ...createDto,
        id: 'new-account-id',
        userId: mockUserId,
      });

      await service.create(mockUserId, createDto);

      expect(mockPrismaService.account.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUserId, isDefault: true },
        data: { isDefault: false },
      });
    });
  });

  describe('findAll', () => {
    it('should return all accounts for a user', async () => {
      const mockAccounts = [mockAccount, { ...mockAccount, id: 'account-456', isDefault: false }];
      mockPrismaService.account.findMany.mockResolvedValue(mockAccounts);

      const result = await service.findAll(mockUserId);

      expect(result).toHaveLength(2);
      expect(mockPrismaService.account.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      });
    });
  });

  describe('findOne', () => {
    it('should return an account by id', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(mockAccount);

      const result = await service.findOne(mockAccount.id, mockUserId);

      expect(result).toEqual(mockAccount);
    });

    it('should throw NotFoundException when account does not exist', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent', mockUserId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own account', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(mockAccount);

      await expect(service.findOne(mockAccount.id, 'different-user')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update an account', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(mockAccount);
      mockPrismaService.account.update.mockResolvedValue({
        ...mockAccount,
        name: 'Updated Name',
      });

      const result = await service.update(mockAccount.id, mockUserId, { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
    });
  });

  describe('remove', () => {
    it('should delete an account', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue({ ...mockAccount, isDefault: false });
      mockPrismaService.account.count.mockResolvedValue(2);
      mockPrismaService.account.delete.mockResolvedValue(mockAccount);

      await service.remove(mockAccount.id, mockUserId);

      expect(mockPrismaService.account.delete).toHaveBeenCalledWith({
        where: { id: mockAccount.id },
      });
    });

    it('should throw BadRequestException when deleting the only account', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(mockAccount);
      mockPrismaService.account.count.mockResolvedValue(1);

      await expect(service.remove(mockAccount.id, mockUserId)).rejects.toThrow(BadRequestException);
    });

    it('should set another account as default when deleting default account', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(mockAccount);
      mockPrismaService.account.count.mockResolvedValue(2);
      mockPrismaService.account.findFirst.mockResolvedValue({ id: 'other-account' });
      mockPrismaService.account.update.mockResolvedValue({ id: 'other-account', isDefault: true });
      mockPrismaService.account.delete.mockResolvedValue(mockAccount);

      await service.remove(mockAccount.id, mockUserId);

      expect(mockPrismaService.account.update).toHaveBeenCalledWith({
        where: { id: 'other-account' },
        data: { isDefault: true },
      });
    });
  });

  describe('transfer', () => {
    const transferDto = {
      fromAccountId: 'account-1',
      toAccountId: 'account-2',
      amount: 100,
      description: 'Test transfer',
    };

    it('should transfer funds between accounts', async () => {
      const fromAccount = { ...mockAccount, id: 'account-1', balance: 500 };
      const toAccount = { ...mockAccount, id: 'account-2', balance: 200, isDefault: false };

      mockPrismaService.account.findUnique
        .mockResolvedValueOnce(fromAccount)
        .mockResolvedValueOnce(toAccount);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          account: {
            update: jest.fn()
              .mockResolvedValueOnce({ ...fromAccount, balance: 400 })
              .mockResolvedValueOnce({ ...toAccount, balance: 300 }),
          },
          transaction: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await service.transfer(mockUserId, transferDto);

      expect(result.fromAccount.balance).toBe(400);
      expect(result.toAccount.balance).toBe(300);
    });

    it('should throw BadRequestException when transferring to same account', async () => {
      const account = { ...mockAccount };
      mockPrismaService.account.findUnique.mockResolvedValue(account);

      await expect(
        service.transfer(mockUserId, {
          fromAccountId: mockAccount.id,
          toAccountId: mockAccount.id,
          amount: 100,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when insufficient balance', async () => {
      const fromAccount = { ...mockAccount, id: 'account-1', balance: 50 };
      const toAccount = { ...mockAccount, id: 'account-2', isDefault: false };

      mockPrismaService.account.findUnique
        .mockResolvedValueOnce(fromAccount)
        .mockResolvedValueOnce(toAccount);

      await expect(
        service.transfer(mockUserId, { ...transferDto, amount: 100 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTotalBalance', () => {
    it('should return total balance across all accounts', async () => {
      mockPrismaService.account.aggregate.mockResolvedValue({
        _sum: { balance: 5000 },
      });

      const result = await service.getTotalBalance(mockUserId);

      expect(result).toBe(5000);
    });

    it('should return 0 when no accounts exist', async () => {
      mockPrismaService.account.aggregate.mockResolvedValue({
        _sum: { balance: null },
      });

      const result = await service.getTotalBalance(mockUserId);

      expect(result).toBe(0);
    });
  });

  describe('getBalancesByType', () => {
    it('should return balances grouped by account type', async () => {
      mockPrismaService.account.groupBy.mockResolvedValue([
        { type: AccountType.CHECKING, _sum: { balance: 3000 } },
        { type: AccountType.SAVINGS, _sum: { balance: 2000 } },
      ]);

      const result = await service.getBalancesByType(mockUserId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ type: AccountType.CHECKING, balance: 3000 });
      expect(result[1]).toEqual({ type: AccountType.SAVINGS, balance: 2000 });
    });
  });
});
