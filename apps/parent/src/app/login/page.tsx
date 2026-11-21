'use client';

import { DEMO_ACCOUNTS } from '@schoolcoin/mock-data';
import { LoginScreen } from '@schoolcoin/ui';
import Link from 'next/link';

const demoAccounts = DEMO_ACCOUNTS.filter((a) => a.role === 'PARENT');

export default function LoginPage() {
  return (
    <LoginScreen
      product="Phụ huynh"
      description="Theo dõi số dư và nạp xu cho con."
      placeholder="ban@gmail.com"
      wrongAppMessage="Tài khoản nhân viên không dùng ứng dụng phụ huynh."
      demoAccounts={demoAccounts}
      footer={
        <div className="flex flex-col gap-2">
          <span>
            Lần đầu sử dụng?{' '}
            <Link
              href="/register"
              className="font-semibold text-ink-fg underline decoration-brand underline-offset-4"
            >
              Đăng ký bằng mã mời
            </Link>
          </span>
          <Link href="/forgot-password" className="text-ink-muted hover:text-ink-fg">
            Quên mật khẩu?
          </Link>
        </div>
      }
    />
  );
}
