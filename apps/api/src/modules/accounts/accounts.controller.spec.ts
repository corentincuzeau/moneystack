import { Test, TestingModule } from '@nestjs/testing';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { AccountType } from '@prisma/client';

describe('AccountsController', () => {
  let controller: AccountsController;
  let service: AccountsService;

  const mockUser = { sub: 'user-123', email: 'test@test.com', name: 'Test User' };
  const mockAccount = {
    id: 'account-123',
    userId: mockUser.sub,
    name: 'Test Account',
    type: AccountType.CHECKING,
    balance: 1000,
    color: '#3B82F6',
    icon: 'wallet',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAccountsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    transfer: jest.fn(),
    getTotalBalance: jest.fn(),
    getBalancesByType: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [
        {
          provide: AccountsService,
          useValue: mockAccountsService,
        },
      ],
    }).compile();

    controller = module.get<AccountsController>(AccountsController);
    service = module.get<AccountsService>(AccountsService);
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
      };

      mockAccountsService.create.mockResolvedValue({ ...createDto, id: 'new-id', userId: mockUser.sub });

      const result = await controller.create(mockUser, createDto);

      expect(result.name).toBe(createDto.name);
      expect(mockAccountsService.create).toHaveBeenCalledWith(mockUser.sub, createDto);
    });
  });

  describe('findAll', () => {
    it('should return all accounts', async () => {
      mockAccountsService.findAll.mockResolvedValue([mockAccount]);

      const result = await controller.findAll(mockUser);

      expect(result).toHaveLength(1);
      expect(mockAccountsService.findAll).toHaveBeenCalledWith(mockUser.sub);
    });
  });

  describe('findOne', () => {
    it('should return a single account', async () => {
      mockAccountsService.findOne.mockResolvedValue(mockAccount);

      const result = await controller.findOne(mockAccount.id, mockUser);

      expect(result).toEqual(mockAccount);
      expect(mockAccountsService.findOne).toHaveBeenCalledWith(mockAccount.id, mockUser.sub);
    });
  });

  describe('update', () => {
    it('should update an account', async () => {
      const updateDto = { name: 'Updated Name' };
      mockAccountsService.update.mockResolvedValue({ ...mockAccount, ...updateDto });

      const result = await controller.update(mockAccount.id, mockUser, updateDto);

      expect(result.name).toBe('Updated Name');
      expect(mockAccountsService.update).toHaveBeenCalledWith(mockAccount.id, mockUser.sub, updateDto);
    });
  });

  describe('remove', () => {
    it('should delete an account', async () => {
      mockAccountsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockAccount.id, mockUser);

      expect(result.message).toBe('Account deleted successfully');
      expect(mockAccountsService.remove).toHaveBeenCalledWith(mockAccount.id, mockUser.sub);
    });
  });

  describe('transfer', () => {
    it('should transfer funds between accounts', async () => {
      const transferDto = {
        fromAccountId: 'account-1',
        toAccountId: 'account-2',
        amount: 100,
      };

      mockAccountsService.transfer.mockResolvedValue({
        fromAccount: { id: 'account-1', balance: 400 },
        toAccount: { id: 'account-2', balance: 300 },
      });

      const result = await controller.transfer(mockUser, transferDto);

      expect(result.fromAccount.balance).toBe(400);
      expect(result.toAccount.balance).toBe(300);
    });
  });

  describe('getTotalBalance', () => {
    it('should return total balance', async () => {
      mockAccountsService.getTotalBalance.mockResolvedValue(5000);

      const result = await controller.getTotalBalance(mockUser);

      expect(result.total).toBe(5000);
    });
  });

  describe('getBalancesByType', () => {
    it('should return balances by type', async () => {
      const balances = [
        { type: AccountType.CHECKING, balance: 3000 },
        { type: AccountType.SAVINGS, balance: 2000 },
      ];
      mockAccountsService.getBalancesByType.mockResolvedValue(balances);

      const result = await controller.getBalancesByType(mockUser);

      expect(result).toEqual(balances);
    });
  });
});
