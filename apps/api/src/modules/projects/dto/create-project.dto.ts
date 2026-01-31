import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsDateString,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ example: 'Vacances été 2024' })
  @IsString({ message: 'Le nom doit être un texte' })
  @MinLength(1, { message: 'Le nom du projet est requis' })
  name: string;

  @ApiPropertyOptional({ example: 'Voyage en Italie pour 2 semaines' })
  @IsString({ message: 'La description doit être un texte' })
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 3000 })
  @IsNumber({}, { message: 'Le montant cible doit être un nombre' })
  @Min(0, { message: 'Le montant cible ne peut pas être négatif' })
  targetAmount: number;

  @ApiPropertyOptional({ example: 500 })
  @IsNumber({}, { message: 'Le montant actuel doit être un nombre' })
  @Min(0, { message: 'Le montant actuel ne peut pas être négatif' })
  @IsOptional()
  currentAmount?: number;

  @ApiPropertyOptional({ example: '2024-07-01' })
  @IsDateString({}, { message: 'La date limite doit être au format AAAA-MM-JJ' })
  @IsOptional()
  deadline?: string;

  @ApiPropertyOptional({ example: 'uuid-account-id' })
  @IsUUID('4', { message: 'Le compte sélectionné est invalide' })
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional({ example: '#8B5CF6' })
  @IsString({ message: 'La couleur doit être un texte' })
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ example: 'plane' })
  @IsString({ message: 'L\'icône doit être un texte' })
  @IsOptional()
  icon?: string;
}
