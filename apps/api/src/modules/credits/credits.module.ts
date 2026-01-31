import { Module } from '@nestjs/common';
import { CreditsService } from './credits.service';
import { CreditsController } from './credits.controller';
import { CreditsScheduler } from './credits.scheduler';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
  imports: [AccountsModule],
  controllers: [CreditsController],
  providers: [CreditsService, CreditsScheduler],
  exports: [CreditsService],
})
export class CreditsModule {}
