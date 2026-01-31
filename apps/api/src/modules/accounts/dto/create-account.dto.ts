import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum, MinLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType } from '@prisma/client';

export class CreateAccountDto {
  @ApiProperty({ example: 'Compte Courant SG' })
  @IsString({ message: 'Le nom doit être un texte' })
  @MinLength(1, { message: 'Le nom du compte est requis' })
  name: string;

  @ApiProperty({ enum: AccountType, example: AccountType.CHECKING })
  @IsEnum(AccountType, { message: 'Le type de compte doit être CHECKING, SAVINGS, CASH ou INVESTMENT' })
  type: AccountType;

  @ApiProperty({ example: 1500.50 })
  @IsNumber({}, { message: 'Le solde doit être un nombre' })
  @Min(0, { message: 'Le solde ne peut pas être négatif' })
  balance: number;

  @ApiPropertyOptional({ example: '#3B82F6' })
  @IsString({ message: 'La couleur doit être un texte' })
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ example: 'wallet' })
  @IsString({ message: 'L\'icône doit être un texte' })
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean({ message: 'La valeur par défaut doit être vrai ou faux' })
  @IsOptional()
  isDefault?: boolean;
}
