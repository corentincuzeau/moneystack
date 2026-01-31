import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsUUID,
  IsInt,
  IsDateString,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreditType } from '@prisma/client';

export class UpdateCreditDto {
  @ApiPropertyOptional({ example: 'uuid-account-id' })
  @IsUUID()
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional({ example: 'Crédit immobilier' })
  @IsString()
  @MinLength(1)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: CreditType })
  @IsEnum(CreditType)
  @IsOptional()
  type?: CreditType;

  @ApiPropertyOptional({ example: 200000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalAmount?: number;

  @ApiPropertyOptional({ example: 180000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  remainingAmount?: number;

  @ApiPropertyOptional({ example: 1150 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  monthlyPayment?: number;

  @ApiPropertyOptional({ example: 2.3 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  interestRate?: number;

  @ApiPropertyOptional({ example: '2020-01-15' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2040-01-15' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsInt()
  @Min(1)
  @Max(31)
  @IsOptional()
  paymentDay?: number;

  @ApiPropertyOptional({ example: 7 })
  @IsInt()
  @Min(0)
  @Max(30)
  @IsOptional()
  reminderDays?: number;

  @ApiPropertyOptional({ example: 'Renégociation en cours' })
  @IsString()
  @IsOptional()
  notes?: string;
}
