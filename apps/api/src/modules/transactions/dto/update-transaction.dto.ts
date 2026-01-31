import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsArray,
  IsBoolean,
  Min,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType, RecurringFrequency } from '@prisma/client';

export class UpdateTransactionDto {
  @ApiPropertyOptional({ example: 'uuid-account-id' })
  @IsUUID()
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional({ example: 'uuid-category-id' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: 175.00 })
  @IsNumber()
  @Min(0.01)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ enum: TransactionType })
  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @ApiPropertyOptional({ example: 'Courses Leclerc' })
  @IsString()
  @MinLength(1)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '2024-01-16' })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ example: ['alimentaire'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ example: true, description: 'Transaction récurrente' })
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @ApiPropertyOptional({ enum: RecurringFrequency, description: 'Fréquence de la transaction' })
  @IsEnum(RecurringFrequency)
  @IsOptional()
  recurringFrequency?: RecurringFrequency;
}
