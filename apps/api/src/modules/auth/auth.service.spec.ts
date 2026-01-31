import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService, GoogleUser } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    id: 'user-123',
    email: 'test@test.com',
    name: 'Test User',
    googleId: 'google-123',
    avatarUrl: 'https://example.com/avatar.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    findByGoogleId: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const mockPrismaService = {
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        'jwt.secret': 'test-secret',
        'jwt.expiration': '7d',
        'jwt.refreshExpiration': '30d',
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateGoogleUser', () => {
    const googleUser: GoogleUser = {
      email: 'test@test.com',
      name: 'Test User',
      googleId: 'google-123',
      avatarUrl: 'https://example.com/avatar.jpg',
    };

    it('should return existing user found by googleId', async () => {
      mockUsersService.findByGoogleId.mockResolvedValue(mockUser);

      const result = await service.validateGoogleUser(googleUser);

      expect(result).toEqual(mockUser);
      expect(mockUsersService.findByGoogleId).toHaveBeenCalledWith('google-123');
    });

    it('should create new user if not exists', async () => {
      mockUsersService.findByGoogleId.mockResolvedValue(null);
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await service.validateGoogleUser(googleUser);

      expect(mockUsersService.create).toHaveBeenCalledWith(googleUser);
      expect(result).toEqual(mockUser);
    });

    it('should link existing email user with Google account', async () => {
      const existingUser = { ...mockUser, googleId: null };
      mockUsersService.findByGoogleId.mockResolvedValue(null);
      mockUsersService.findByEmail.mockResolvedValue(existingUser);
      mockUsersService.update.mockResolvedValue(mockUser);

      const result = await service.validateGoogleUser(googleUser);

      expect(mockUsersService.update).toHaveBeenCalledWith(existingUser.id, {
        googleId: googleUser.googleId,
        avatarUrl: googleUser.avatarUrl,
      });
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', async () => {
      const accessToken = 'access-token';

      mockJwtService.sign.mockReturnValue(accessToken);
      mockPrismaService.refreshToken.create.mockResolvedValue({
        token: 'refresh-token-uuid',
      });

      const result = await service.generateTokens(mockUser.id, mockUser.email, mockUser.name);

      expect(result.accessToken).toBe(accessToken);
      expect(result.refreshToken).toBeDefined();
      expect(result.expiresIn).toBeDefined();
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      });
      expect(mockPrismaService.refreshToken.create).toHaveBeenCalled();
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const validRefreshToken = {
        id: 'token-id',
        userId: mockUser.id,
        token: 'valid-refresh-token',
        expiresAt: new Date(Date.now() + 86400000),
        user: mockUser,
      };

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(validRefreshToken);
      mockPrismaService.refreshToken.delete.mockResolvedValue({});
      mockPrismaService.refreshToken.create.mockResolvedValue({});
      mockJwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refreshTokens('valid-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
      expect(mockPrismaService.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: validRefreshToken.id },
      });
    });

    it('should throw UnauthorizedException with invalid refresh token', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refreshTokens('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException with expired refresh token', async () => {
      const expiredRefreshToken = {
        id: 'token-id',
        userId: mockUser.id,
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 86400000),
      };

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(expiredRefreshToken);
      mockPrismaService.refreshToken.delete.mockResolvedValue({});

      await expect(service.refreshTokens('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('revokeRefreshToken', () => {
    it('should delete refresh token on logout', async () => {
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      await service.revokeRefreshToken('refresh-token');

      expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { token: 'refresh-token' },
      });
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should delete all refresh tokens for user', async () => {
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 3 });

      await service.revokeAllUserTokens(mockUser.id);

      expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
      });
    });
  });

  describe('validateJwtPayload', () => {
    it('should return user for valid payload', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await service.validateJwtPayload({
        sub: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      });

      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException for invalid user', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      await expect(
        service.validateJwtPayload({
          sub: 'non-existent',
          email: 'test@test.com',
          name: 'Test',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
