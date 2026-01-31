import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { TransferDto } from './dto/transfer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({ status: 201, description: 'Account created' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateAccountDto) {
    return this.accountsService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all accounts' })
  @ApiResponse({ status: 200, description: 'List of accounts' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.accountsService.findAll(user.sub);
  }

  @Get('total-balance')
  @ApiOperation({ summary: 'Get total balance across all accounts' })
  async getTotalBalance(@CurrentUser() user: JwtPayload) {
    const total = await this.accountsService.getTotalBalance(user.sub);
    return { total };
  }

  @Get('balances-by-type')
  @ApiOperation({ summary: 'Get balances grouped by account type' })
  getBalancesByType(@CurrentUser() user: JwtPayload) {
    return this.accountsService.getBalancesByType(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID' })
  @ApiResponse({ status: 200, description: 'Account found' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.accountsService.findOne(id, user.sub);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update account' })
  @ApiResponse({ status: 200, description: 'Account updated' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountsService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete account' })
  @ApiResponse({ status: 200, description: 'Account deleted' })
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.accountsService.remove(id, user.sub);
    return { message: 'Account deleted successfully' };
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Transfer between accounts' })
  @ApiResponse({ status: 200, description: 'Transfer completed' })
  transfer(@CurrentUser() user: JwtPayload, @Body() dto: TransferDto) {
    return this.accountsService.transfer(user.sub, dto);
  }
}
