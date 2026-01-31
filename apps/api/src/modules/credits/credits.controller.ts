import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CreditsService } from './credits.service';
import { CreateCreditDto } from './dto/create-credit.dto';
import { UpdateCreditDto } from './dto/update-credit.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('credits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new credit' })
  @ApiResponse({ status: 201, description: 'Credit created' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCreditDto) {
    return this.creditsService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all credits' })
  @ApiResponse({ status: 200, description: 'List of credits' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.creditsService.findAll(user.sub);
  }

  @Get('upcoming-payments')
  @ApiOperation({ summary: 'Get upcoming credit payments' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  getUpcomingPayments(@CurrentUser() user: JwtPayload, @Query('days') days?: number) {
    return this.creditsService.getUpcomingPayments(user.sub, days || 30);
  }

  @Get('total-monthly')
  @ApiOperation({ summary: 'Get total monthly credit payments' })
  async getTotalMonthly(@CurrentUser() user: JwtPayload) {
    const total = await this.creditsService.getTotalMonthlyPayments(user.sub);
    return { total };
  }

  @Get('total-debt')
  @ApiOperation({ summary: 'Get total remaining debt' })
  async getTotalDebt(@CurrentUser() user: JwtPayload) {
    const total = await this.creditsService.getTotalRemainingDebt(user.sub);
    return { total };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get credit by ID' })
  @ApiResponse({ status: 200, description: 'Credit found' })
  @ApiResponse({ status: 404, description: 'Credit not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.creditsService.findOne(id, user.sub);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update credit' })
  @ApiResponse({ status: 200, description: 'Credit updated' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateCreditDto,
  ) {
    return this.creditsService.update(id, user.sub, dto);
  }

  @Post(':id/payment')
  @ApiOperation({ summary: 'Record a credit payment' })
  @ApiResponse({ status: 200, description: 'Payment recorded' })
  recordPayment(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: RecordPaymentDto,
  ) {
    return this.creditsService.recordPayment(id, user.sub, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete credit' })
  @ApiResponse({ status: 200, description: 'Credit deleted' })
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.creditsService.remove(id, user.sub);
    return { message: 'Credit deleted successfully' };
  }
}
