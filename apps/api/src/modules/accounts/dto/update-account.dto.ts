import { IsString, IsBoolean, IsOptional, IsEnum, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType } from '@prisma/client';

export class UpdateAccountDto {
  @ApiPropertyOptional({ example: 'Compte Principal' })
  @IsString()
  @MinLength(1)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: AccountType })
  @IsEnum(AccountType)
  @IsOptional()
  type?: AccountType;

  @ApiPropertyOptional({ example: '#10B981' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ example: 'bank' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
