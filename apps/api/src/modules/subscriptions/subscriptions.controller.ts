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
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsScheduler } from './subscriptions.scheduler';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly subscriptionsScheduler: SubscriptionsScheduler,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all subscriptions' })
  @ApiResponse({ status: 200, description: 'List of subscriptions' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.subscriptionsService.findAll(user.sub);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming subscriptions' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of upcoming subscriptions' })
  findUpcoming(@CurrentUser() user: JwtPayload, @Query('days') days?: number) {
    return this.subscriptionsService.findUpcoming(user.sub, days || 30);
  }

  @Get('total-monthly')
  @ApiOperation({ summary: 'Get total monthly subscription cost' })
  async getTotalMonthly(@CurrentUser() user: JwtPayload) {
    const total = await this.subscriptionsService.getTotalMonthly(user.sub);
    return { total };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription by ID' })
  @ApiResponse({ status: 200, description: 'Subscription found' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.subscriptionsService.findOne(id, user.sub);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update subscription' })
  @ApiResponse({ status: 200, description: 'Subscription updated' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.update(id, user.sub, dto);
  }

  @Post(':id/process-payment')
  @ApiOperation({ summary: 'Process subscription payment' })
  @ApiResponse({ status: 200, description: 'Payment processed' })
  processPayment(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.subscriptionsService.processPayment(id, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete subscription' })
  @ApiResponse({ status: 200, description: 'Subscription deleted' })
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.subscriptionsService.remove(id, user.sub);
    return { message: 'Subscription deleted successfully' };
  }

  @Post('process-due')
  @ApiOperation({ summary: 'Process all due subscriptions (manual trigger)' })
  @ApiResponse({ status: 200, description: 'Due subscriptions processed' })
  async processDueSubscriptions() {
    await this.subscriptionsScheduler.processDueSubscriptions();
    return { message: 'Traitement des abonnements dus terminé' };
  }
}
