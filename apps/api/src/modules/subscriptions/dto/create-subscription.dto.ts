import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsUUID,
  IsInt,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RecurringFrequency } from '@prisma/client';

export class CreateSubscriptionDto {
  @ApiProperty({ example: 'uuid-account-id' })
  @IsUUID('4', { message: 'Le compte sélectionné est invalide' })
  accountId: string;

  @ApiPropertyOptional({ example: 'uuid-category-id' })
  @IsUUID('4', { message: 'La catégorie sélectionnée est invalide' })
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ example: 'Netflix' })
  @IsString({ message: 'Le nom doit être un texte' })
  @MinLength(1, { message: "Le nom de l'abonnement est requis" })
  name: string;

  @ApiProperty({ example: 13.49 })
  @IsNumber({}, { message: 'Le montant doit être un nombre' })
  @Min(0.01, { message: 'Le montant doit être supérieur à 0' })
  amount: number;

  @ApiProperty({ enum: RecurringFrequency, example: RecurringFrequency.MONTHLY })
  @IsEnum(RecurringFrequency, {
    message: 'La fréquence doit être DAILY, WEEKLY, MONTHLY ou YEARLY',
  })
  frequency: RecurringFrequency;

  @ApiProperty({ example: 15, description: 'Jour de prélèvement dans le mois (1-31)' })
  @IsInt({ message: 'Le jour de prélèvement doit être un nombre entier' })
  @Min(1, { message: 'Le jour de prélèvement doit être entre 1 et 31' })
  @Max(31, { message: 'Le jour de prélèvement doit être entre 1 et 31' })
  paymentDay: number;

  @ApiPropertyOptional({ example: 3 })
  @IsInt({ message: 'Le rappel doit être un nombre entier' })
  @Min(0, { message: 'Le rappel ne peut pas être négatif' })
  @Max(30, { message: 'Le rappel ne peut pas dépasser 30 jours' })
  @IsOptional()
  reminderDays?: number;

  @ApiPropertyOptional({ example: 'tv' })
  @IsString({ message: "L'icône doit être un texte" })
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ example: '#E50914' })
  @IsString({ message: 'La couleur doit être un texte' })
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ example: 'Abonnement streaming vidéo' })
  @IsString({ message: 'Les notes doivent être un texte' })
  @IsOptional()
  notes?: string;
}
