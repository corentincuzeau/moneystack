import { IsString, IsNumber, IsOptional, IsUUID, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransferDto {
  @ApiProperty({ example: 'uuid-from-account' })
  @IsUUID()
  fromAccountId: string;

  @ApiProperty({ example: 'uuid-to-account' })
  @IsUUID()
  toAccountId: string;

  @ApiProperty({ example: 500.00 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'Transfert épargne mensuelle' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsDateString()
  @IsOptional()
  date?: string;
}
