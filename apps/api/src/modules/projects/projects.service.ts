import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AccountsService } from '../accounts/accounts.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ContributeDto } from './dto/contribute.dto';
import { Project, ProjectStatus } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountsService: AccountsService,
  ) {}

  async create(userId: string, dto: CreateProjectDto): Promise<Project> {
    if (dto.accountId) {
      await this.accountsService.findOne(dto.accountId, userId);
    }

    return this.prisma.project.create({
      data: {
        ...dto,
        userId,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
      },
      include: {
        account: true,
      },
    });
  }

  async findAll(userId: string, status?: ProjectStatus): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: {
        userId,
        ...(status && { status }),
      },
      include: {
        account: true,
        contributions: {
          orderBy: { date: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        account: true,
        contributions: {
          include: { account: true },
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return project;
  }

  async update(id: string, userId: string, dto: UpdateProjectDto): Promise<Project> {
    await this.findOne(id, userId);

    if (dto.accountId) {
      await this.accountsService.findOne(dto.accountId, userId);
    }

    return this.prisma.project.update({
      where: { id },
      data: {
        ...dto,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      },
      include: {
        account: true,
      },
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId);
    await this.prisma.project.delete({ where: { id } });
  }

  async contribute(id: string, userId: string, dto: ContributeDto) {
    const project = await this.findOne(id, userId);
    const account = await this.accountsService.findOne(dto.accountId, userId);

    if (account.balance < dto.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    return this.prisma.$transaction(async (tx) => {
      // Create contribution
      const contribution = await tx.projectContribution.create({
        data: {
          projectId: id,
          accountId: dto.accountId,
          amount: dto.amount,
          notes: dto.notes,
        },
        include: { account: true },
      });

      // Update project current amount
      const newAmount = project.currentAmount + dto.amount;
      const newStatus = newAmount >= project.targetAmount ? ProjectStatus.COMPLETED : project.status;

      await tx.project.update({
        where: { id },
        data: {
          currentAmount: { increment: dto.amount },
          status: newStatus,
        },
      });

      // Deduct from account
      await tx.account.update({
        where: { id: dto.accountId },
        data: { balance: { decrement: dto.amount } },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          accountId: dto.accountId,
          amount: dto.amount,
          type: 'EXPENSE',
          description: `Épargne: ${project.name}`,
          date: new Date(),
        },
      });

      return contribution;
    });
  }

  async getProgress(id: string, userId: string) {
    const project = await this.findOne(id, userId);

    const progress = project.targetAmount > 0
      ? (project.currentAmount / project.targetAmount) * 100
      : 0;

    const remaining = Math.max(0, project.targetAmount - project.currentAmount);

    let daysRemaining: number | null = null;
    if (project.deadline) {
      const now = new Date();
      const deadline = new Date(project.deadline);
      daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Calculate average monthly contribution
    const contributions = await this.prisma.projectContribution.findMany({
      where: { projectId: id },
      orderBy: { date: 'asc' },
    });

    let monthlyAverage = 0;
    if (contributions.length > 0) {
      const firstDate = contributions[0].date;
      const months = Math.max(1, (Date.now() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
      monthlyAverage = project.currentAmount / months;
    }

    // Estimate completion date based on average
    let estimatedCompletion: Date | null = null;
    if (monthlyAverage > 0 && remaining > 0) {
      const monthsNeeded = remaining / monthlyAverage;
      estimatedCompletion = new Date();
      estimatedCompletion.setMonth(estimatedCompletion.getMonth() + Math.ceil(monthsNeeded));
    }

    return {
      currentAmount: project.currentAmount,
      targetAmount: project.targetAmount,
      progress: Math.round(progress * 100) / 100,
      remaining,
      daysRemaining,
      monthlyAverage: Math.round(monthlyAverage * 100) / 100,
      estimatedCompletion,
      status: project.status,
    };
  }

  async getTotalSavings(userId: string): Promise<number> {
    const result = await this.prisma.project.aggregate({
      where: { userId, status: 'ACTIVE' },
      _sum: { currentAmount: true },
    });

    return result._sum.currentAmount || 0;
  }
}
