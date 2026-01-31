import { IsNumber, IsDateString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecordPaymentDto {
  @ApiProperty({ example: 1200 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: 900 })
  @IsNumber()
  @Min(0)
  principal: number;

  @ApiProperty({ example: 300 })
  @IsNumber()
  @Min(0)
  interest: number;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  paymentDate: string;
}
