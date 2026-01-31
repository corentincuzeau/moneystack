import { IsString, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ContributeDto {
  @ApiProperty({ example: 'uuid-account-id' })
  @IsUUID()
  accountId: string;

  @ApiProperty({ example: 200 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'Épargne mensuelle janvier' })
  @IsString()
  @IsOptional()
  notes?: string;
}
