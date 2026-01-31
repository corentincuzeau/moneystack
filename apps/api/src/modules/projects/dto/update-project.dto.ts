import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  Min,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'Vacances Italie' })
  @IsString()
  @MinLength(1)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Rome, Florence, Venise' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 3500 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  targetAmount?: number;

  @ApiPropertyOptional({ example: '2024-08-01' })
  @IsDateString()
  @IsOptional()
  deadline?: string;

  @ApiPropertyOptional({ example: 'uuid-account-id' })
  @IsUUID()
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ApiPropertyOptional({ example: '#EC4899' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ example: 'map' })
  @IsString()
  @IsOptional()
  icon?: string;
}
