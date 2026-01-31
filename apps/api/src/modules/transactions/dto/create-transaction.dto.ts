import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsArray,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType, RecurringFrequency } from '@prisma/client';

export class CreateTransactionDto {
  @ApiProperty({ example: 'uuid-account-id' })
  @IsUUID('4', { message: 'Le compte sélectionné est invalide' })
  accountId: string;

  @ApiPropertyOptional({ example: 'uuid-category-id' })
  @IsUUID('4', { message: 'La catégorie sélectionnée est invalide' })
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ example: 150.50 })
  @IsNumber({}, { message: 'Le montant doit être un nombre' })
  @Min(0.01, { message: 'Le montant doit être supérieur à 0' })
  amount: number;

  @ApiProperty({ enum: TransactionType, example: TransactionType.EXPENSE })
  @IsEnum(TransactionType, { message: 'Le type doit être INCOME, EXPENSE ou TRANSFER' })
  type: TransactionType;

  @ApiProperty({ example: 'Courses Carrefour' })
  @IsString({ message: 'La description doit être un texte' })
  @MinLength(1, { message: 'La description est requise' })
  description: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString({}, { message: 'La date doit être au format AAAA-MM-JJ' })
  date: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean({ message: 'La valeur récurrente doit être vrai ou faux' })
  @IsOptional()
  isRecurring?: boolean;

  @ApiPropertyOptional({ enum: RecurringFrequency })
  @IsEnum(RecurringFrequency, { message: 'La fréquence doit être DAILY, WEEKLY, MONTHLY ou YEARLY' })
  @IsOptional()
  recurringFrequency?: RecurringFrequency;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsDateString({}, { message: 'La date de fin doit être au format AAAA-MM-JJ' })
  @IsOptional()
  recurringEndDate?: string;

  @ApiPropertyOptional({ example: ['alimentaire', 'mensuel'] })
  @IsArray({ message: 'Les tags doivent être une liste' })
  @IsString({ each: true, message: 'Chaque tag doit être un texte' })
  @IsOptional()
  tags?: string[];
}
