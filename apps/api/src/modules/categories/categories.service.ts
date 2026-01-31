import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category, CategoryType } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCategoryDto): Promise<Category> {
    // Check if category with same name exists for user
    const existing = await this.prisma.category.findFirst({
      where: {
        userId,
        name: dto.name,
        type: dto.type,
      },
    });

    if (existing) {
      throw new BadRequestException('Category with this name already exists');
    }

    return this.prisma.category.create({
      data: {
        ...dto,
        userId,
        isDefault: false,
      },
    });
  }

  async findAll(userId: string, type?: CategoryType): Promise<Category[]> {
    const where: { OR: { userId: string | null }[]; type?: CategoryType } = {
      OR: [{ userId }, { userId: null }],
    };

    if (type) {
      where.type = type;
    }

    return this.prisma.category.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string, userId: string): Promise<Category> {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Category must be default (userId = null) or belong to user
    if (category.userId && category.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return category;
  }

  async update(id: string, userId: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id, userId);

    // Cannot update default categories
    if (category.isDefault) {
      throw new ForbiddenException('Cannot update default categories');
    }

    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const category = await this.findOne(id, userId);

    if (category.isDefault) {
      throw new ForbiddenException('Cannot delete default categories');
    }

    // Check if category is used in any transactions
    const transactionsCount = await this.prisma.transaction.count({
      where: { categoryId: id },
    });

    if (transactionsCount > 0) {
      throw new BadRequestException(
        `Cannot delete category: it is used in ${transactionsCount} transaction(s)`,
      );
    }

    await this.prisma.category.delete({ where: { id } });
  }

  async getWithStats(userId: string, startDate?: Date, endDate?: Date) {
    const categories = await this.findAll(userId);
    const accounts = await this.prisma.account.findMany({
      where: { userId },
      select: { id: true },
    });
    const accountIds = accounts.map((a) => a.id);

    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    const stats = await Promise.all(
      categories.map(async (category) => {
        const transactions = await this.prisma.transaction.aggregate({
          where: {
            categoryId: category.id,
            accountId: { in: accountIds },
            ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
          },
          _sum: { amount: true },
          _count: true,
        });

        return {
          ...category,
          totalAmount: transactions._sum.amount || 0,
          transactionCount: transactions._count,
        };
      }),
    );

    return stats;
  }
}
