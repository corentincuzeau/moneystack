import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { User, Prisma } from '@prisma/client';

export interface CreateUserDto {
  email: string;
  name: string;
  googleId: string;
  avatarUrl?: string;
}

export interface UpdateUserDto {
  name?: string;
  googleId?: string;
  avatarUrl?: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserDto): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        googleId: data.googleId,
        avatarUrl: data.avatarUrl,
        settings: {
          create: {
            currency: 'EUR',
            locale: 'fr-FR',
            timezone: 'Europe/Paris',
          },
        },
      },
    });

    // Create default account for new user
    await this.prisma.account.create({
      data: {
        userId: user.id,
        name: 'Compte principal',
        type: 'CHECKING',
        balance: 0,
        isDefault: true,
        color: '#3B82F6',
        icon: 'wallet',
      },
    });

    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { googleId },
    });
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({
      where: { id },
    });
  }

  async getSettings(userId: string) {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      return this.prisma.userSettings.create({
        data: {
          userId,
          currency: 'EUR',
          locale: 'fr-FR',
          timezone: 'Europe/Paris',
        },
      });
    }

    return settings;
  }

  async updateSettings(userId: string, data: Prisma.UserSettingsUpdateInput) {
    return this.prisma.userSettings.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        currency: typeof data.currency === 'string' ? data.currency : 'EUR',
        locale: typeof data.locale === 'string' ? data.locale : 'fr-FR',
        timezone: typeof data.timezone === 'string' ? data.timezone : 'Europe/Paris',
        lowBalanceThreshold: typeof data.lowBalanceThreshold === 'number' ? data.lowBalanceThreshold : 100,
      },
    });
  }

  async completeOnboarding(userId: string) {
    return this.prisma.userSettings.upsert({
      where: { userId },
      update: { hasCompletedOnboarding: true },
      create: {
        userId,
        currency: 'EUR',
        locale: 'fr-FR',
        timezone: 'Europe/Paris',
        hasCompletedOnboarding: true,
      },
    });
  }
}
