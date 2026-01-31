import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats' })
  getDashboardStats(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getDashboardStats(user.sub);
  }

  @Get('monthly-stats')
  @ApiOperation({ summary: 'Get monthly statistics for a year' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Monthly stats' })
  getMonthlyStats(
    @CurrentUser() user: JwtPayload,
    @Query('year') year?: number,
  ) {
    const targetYear = year || new Date().getFullYear();
    return this.dashboardService.getMonthlyStats(user.sub, targetYear);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Get calendar events (payments, subscriptions)' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiResponse({ status: 200, description: 'Calendar events' })
  getCalendarEvents(
    @CurrentUser() user: JwtPayload,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.dashboardService.getCalendarEvents(
      user.sub,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('year-summary')
  @ApiOperation({ summary: 'Get annual summary' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Year summary' })
  getYearSummary(
    @CurrentUser() user: JwtPayload,
    @Query('year') year?: number,
  ) {
    const targetYear = year || new Date().getFullYear();
    return this.dashboardService.getYearSummary(user.sub, targetYear);
  }

  @Get('budget-summary')
  @ApiOperation({ summary: 'Get budget summary with available spending' })
  @ApiResponse({ status: 200, description: 'Budget summary' })
  getBudgetSummary(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getBudgetSummary(user.sub);
  }

  @Get('future-projection')
  @ApiOperation({ summary: 'Get projected budget for future months' })
  @ApiQuery({ name: 'months', required: false, type: Number, description: 'Number of months to project (default: 6)' })
  @ApiResponse({ status: 200, description: 'Future budget projection' })
  getFutureProjection(
    @CurrentUser() user: JwtPayload,
    @Query('months') months?: number,
  ) {
    return this.dashboardService.getFutureProjection(user.sub, months || 6);
  }
}
