import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { randomUUID } from 'crypto';

export interface GoogleUser {
  email: string;
  name: string;
  googleId: string;
  avatarUrl?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async validateGoogleUser(googleUser: GoogleUser) {
    let user = await this.usersService.findByGoogleId(googleUser.googleId);

    if (!user) {
      user = await this.usersService.findByEmail(googleUser.email);

      if (user) {
        // Link existing user with Google account
        user = await this.usersService.update(user.id, {
          googleId: googleUser.googleId,
          avatarUrl: googleUser.avatarUrl,
        });
      } else {
        // Create new user
        user = await this.usersService.create(googleUser);
      }
    } else {
      // Update avatar if changed
      if (googleUser.avatarUrl && googleUser.avatarUrl !== user.avatarUrl) {
        user = await this.usersService.update(user.id, {
          avatarUrl: googleUser.avatarUrl,
        });
      }
    }

    return user;
  }

  async generateTokens(userId: string, email: string, name: string): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: userId,
      email,
      name,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.generateRefreshToken();

    // Calculate expiration (7 days default)
    const expiresIn = this.getExpirationInSeconds(
      this.configService.get<string>('jwt.expiration', '7d'),
    );

    // Store refresh token
    const refreshExpiration = this.getExpirationInSeconds(
      this.configService.get<string>('jwt.refreshExpiration', '30d'),
    );

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt: new Date(Date.now() + refreshExpiration * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      if (storedToken) {
        await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Delete old refresh token
    await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });

    // Generate new tokens
    return this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.name,
    );
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async validateJwtPayload(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private generateRefreshToken(): string {
    return randomUUID() + '-' + randomUUID();
  }

  private getExpirationInSeconds(expiration: string): number {
    const unit = expiration.slice(-1);
    const value = parseInt(expiration.slice(0, -1), 10);

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 60 * 60 * 24;
      default:
        return 7 * 24 * 60 * 60; // Default 7 days
    }
  }
}
