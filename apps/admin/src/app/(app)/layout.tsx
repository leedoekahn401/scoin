'use client';

import { useApi, useSession } from '@schoolcoin/api-client/react';
import { Capability, can } from '@schoolcoin/types';
import { AppShell, ROLE_LABEL, RequireSession, type NavGroup } from '@schoolcoin/ui';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Banknote,
  ClipboardList,
  CreditCard,
  FileSearch,
  History,
  LayoutDashboard,
  MonitorSmartphone,
  ReceiptText,
  Settings,
  Undo2,
  UserCog,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { queryKeys } from '@/lib/query-keys';

/**
 * The admin frame. The sidebar shows only the sections the signed-in role may
 * use (§B8, permission matrix §4.12); the server enforces the same rules.
 */
function Shell({ children }: { children: ReactNode }) {
  const { user, signOut } = useSession();
  const api = useApi();
  const role = user?.role;
  const money = can(role, Capability.MANAGE_MONEY);

  const dashboard = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => api.admin.dashboard(),
    enabled: can(role, Capability.VIEW_SALES_REPORTS),
    refetchInterval: 30_000,
  });

  const groups: NavGroup[] = [
    {
      items: [{ href: '/', label: 'Tổng quan', icon: <LayoutDashboard />, matchPrefix: false }],
    },
    {
      heading: 'Học sinh',
      items: [
        ...(can(role, Capability.MANAGE_STUDENTS) || money
          ? [{ href: '/students', label: 'Học sinh & ví', icon: <Users /> }]
          : []),
        ...(can(role, Capability.MANAGE_STUDENTS)
          ? [{ href: '/cards', label: 'In thẻ học sinh', icon: <CreditCard /> }]
          : []),
      ],
    },
    {
      heading: 'Căng tin',
      items: [
        ...(can(role, Capability.MANAGE_MENU)
          ? [{ href: '/menu', label: 'Thực đơn & giá', icon: <UtensilsCrossed /> }]
          : []),
        ...(can(role, Capability.VOID_ANY_ORDER)
          ? [{ href: '/orders', label: 'Đơn hàng hôm nay', icon: <ReceiptText /> }]
          : []),
      ],
    },
    {
      heading: 'Thu chi',
      items: money
        ? [
            { href: '/money/cash', label: 'Nạp tiền mặt', icon: <Banknote /> },
            {
              href: '/money/unmatched',
              label: 'Giao dịch chưa khớp',
              icon: <FileSearch />,
              badge: dashboard.data?.unmatchedPayments,
            },
            {
              href: '/money/review',
              label: 'Nạp cần kiểm tra',
              icon: <ClipboardList />,
              badge: dashboard.data?.topUpsToReview,
            },
            { href: '/money/refunds', label: 'Hoàn tiền & điều chỉnh', icon: <Undo2 /> },
          ]
        : [],
    },
    {
      heading: 'Báo cáo',
      items: can(role, Capability.VIEW_SALES_REPORTS)
        ? [{ href: '/reports', label: 'Báo cáo', icon: <BarChart3 /> }]
        : [],
    },
    {
      heading: 'Hệ thống',
      items: [
        ...(can(role, Capability.MANAGE_STAFF) || can(role, Capability.MANAGE_CASHIERS)
          ? [
              {
                href: '/staff',
                label: can(role, Capability.MANAGE_STAFF)
                  ? 'Nhân sự & vai trò'
                  : 'Tài khoản thu ngân',
                icon: <UserCog />,
              },
            ]
          : []),
        ...(can(role, Capability.VIEW_AUDIT_LOG)
          ? [{ href: '/audit', label: 'Nhật ký thao tác', icon: <History /> }]
          : []),
        ...(can(role, Capability.MANAGE_SETTINGS)
          ? [
              { href: '/settings', label: 'Cài đặt', icon: <Settings />, matchPrefix: false },
              { href: '/settings/kiosks', label: 'Thiết bị kiosk', icon: <MonitorSmartphone /> },
            ]
          : []),
      ],
    },
  ].filter((g) => g.items.length > 0);

  return (
    <AppShell
      product="Quản trị"
      groups={groups}
      user={{ name: user?.fullName ?? '', caption: role ? ROLE_LABEL[role] : '' }}
      onSignOut={() => void signOut()}
    >
      {children}
    </AppShell>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <RequireSession>
      <Shell>{children}</Shell>
    </RequireSession>
  );
}
