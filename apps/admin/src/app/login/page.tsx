'use client';

import { DEMO_ACCOUNTS } from '@schoolcoin/mock-data';
import { STAFF_ADMIN_ROLES } from '@schoolcoin/types';
import { LoginScreen } from '@schoolcoin/ui';

const demoAccounts = DEMO_ACCOUNTS.filter((a) =>
  (STAFF_ADMIN_ROLES as readonly string[]).includes(a.role),
);

export default function LoginPage() {
  return (
    <LoginScreen
      product="Quản trị"
      description="Dành cho hội đồng trường, kế toán và quản lý căng tin."
      placeholder="ten@truong.edu.vn"
      wrongAppMessage="Tài khoản này không dùng trang quản trị. Thu ngân đăng nhập ở máy POS, phụ huynh dùng ứng dụng phụ huynh."
      demoAccounts={demoAccounts}
    />
  );
}
