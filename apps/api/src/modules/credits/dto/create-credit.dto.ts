import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreditType } from '@prisma/client';

export class CreateCreditDto {
  @ApiProperty({ example: 'uuid-account-id' })
  @IsUUID('4', { message: 'Le compte sélectionné est invalide' })
  accountId: string;

  @ApiProperty({ example: 'Crédit immobilier résidence principale' })
  @IsString({ message: 'Le nom doit être un texte' })
  @MinLength(1, { message: 'Le nom du crédit est requis' })
  name: string;

  @ApiProperty({ enum: CreditType, example: CreditType.MORTGAGE })
  @IsEnum(CreditType, { message: 'Le type doit être MORTGAGE, CAR_LOAN, PERSONAL_LOAN, STUDENT_LOAN ou OTHER' })
  type: CreditType;

  @ApiProperty({ example: 200000 })
  @IsNumber({}, { message: 'Le montant total doit être un nombre' })
  @Min(0, { message: 'Le montant total ne peut pas être négatif' })
  totalAmount: number;

  @ApiPropertyOptional({ example: 180000, description: 'Defaults to totalAmount if not provided' })
  @IsNumber({}, { message: 'Le montant restant doit être un nombre' })
  @Min(0, { message: 'Le montant restant ne peut pas être négatif' })
  @IsOptional()
  remainingAmount?: number;

  @ApiProperty({ example: 1200 })
  @IsNumber({}, { message: 'La mensualité doit être un nombre' })
  @Min(0, { message: 'La mensualité ne peut pas être négative' })
  monthlyPayment: number;

  @ApiProperty({ example: 2.5 })
  @IsNumber({}, { message: 'Le taux d\'intérêt doit être un nombre' })
  @Min(0, { message: 'Le taux d\'intérêt ne peut pas être négatif' })
  @Max(100, { message: 'Le taux d\'intérêt ne peut pas dépasser 100%' })
  interestRate: number;

  @ApiProperty({ example: '2020-01-15' })
  @IsDateString({}, { message: 'La date de début doit être au format AAAA-MM-JJ' })
  startDate: string;

  @ApiProperty({ example: '2040-01-15' })
  @IsDateString({}, { message: 'La date de fin doit être au format AAAA-MM-JJ' })
  endDate: string;

  @ApiPropertyOptional({ example: 15 })
  @IsInt({ message: 'Le jour de paiement doit être un nombre entier' })
  @Min(1, { message: 'Le jour de paiement doit être entre 1 et 31' })
  @Max(31, { message: 'Le jour de paiement doit être entre 1 et 31' })
  @IsOptional()
  paymentDay?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsInt({ message: 'Le rappel doit être un nombre entier' })
  @Min(0, { message: 'Le rappel ne peut pas être négatif' })
  @Max(30, { message: 'Le rappel ne peut pas dépasser 30 jours' })
  @IsOptional()
  reminderDays?: number;

  @ApiPropertyOptional({ example: 'Prêt à taux fixe' })
  @IsString({ message: 'Les notes doivent être un texte' })
  @IsOptional()
  notes?: string;
}
