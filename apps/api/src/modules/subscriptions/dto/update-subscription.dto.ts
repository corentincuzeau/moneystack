import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsUUID,
  IsInt,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RecurringFrequency } from '@prisma/client';

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ example: 'uuid-account-id' })
  @IsUUID()
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional({ example: 'uuid-category-id' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'Netflix Premium' })
  @IsString()
  @MinLength(1)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 17.99 })
  @IsNumber()
  @Min(0.01)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ enum: RecurringFrequency })
  @IsEnum(RecurringFrequency)
  @IsOptional()
  frequency?: RecurringFrequency;

  @ApiPropertyOptional({ example: 15, description: 'Jour de prélèvement dans le mois (1-31)' })
  @IsInt()
  @Min(1)
  @Max(31)
  @IsOptional()
  paymentDay?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsInt()
  @Min(0)
  @Max(30)
  @IsOptional()
  reminderDays?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'play' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ example: '#FF0000' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ example: 'Abonnement 4K UHD' })
  @IsString()
  @IsOptional()
  notes?: string;
}
