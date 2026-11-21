'use client';

import { DEMO_ACCOUNTS } from '@schoolcoin/mock-data';
import { LoginScreen } from '@schoolcoin/ui';

const demoAccounts = DEMO_ACCOUNTS.filter((a) => a.role === 'CASHIER' || a.role === 'CAFE_MANAGER');

export default function LoginPage() {
  return (
    <LoginScreen
      product="Căng tin"
      title="Mở ca bán hàng"
      description="Thu ngân đăng nhập bằng tên đăng nhập do quản lý cấp."
      identifierLabel="Tên đăng nhập"
      identifierType="text"
      placeholder="thungan1"
      size="lg"
      wrongAppMessage="Tài khoản này không dùng được máy POS."
      demoAccounts={demoAccounts}
    />
  );
}
