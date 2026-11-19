import { Module } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { WalletService } from './wallet.service';

@Module({
  providers: [WalletService, LedgerService],
  exports: [WalletService, LedgerService],
})
export class WalletModule {}
