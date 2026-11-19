import { can, type Permission, type Role } from '@schoolcoin/types';

export interface NavItem {
  href: string;
  label: string;
  permission: Permission;
}

/** B8: the sidebar shows only the sections the signed-in role may use (SRS 4.12). */
export const NAV: NavItem[] = [
  { href: '/', label: 'Tổng quan', permission: 'SALES_REPORTS' },
  { href: '/students', label: 'Học sinh', permission: 'STUDENTS' },
  { href: '/cards/print', label: 'In thẻ', permission: 'STUDENTS' },
  { href: '/users', label: 'Nhân viên', permission: 'MENU_AND_CASHIERS' },
  { href: '/menu', label: 'Thực đơn', permission: 'MENU_AND_CASHIERS' },
  { href: '/finance/cash-topup', label: 'Nạp tiền mặt', permission: 'FINANCE' },
  { href: '/finance/unmatched', label: 'Giao dịch chưa khớp', permission: 'FINANCE' },
  { href: '/finance/review', label: 'Nạp tiền cần kiểm tra', permission: 'FINANCE' },
  { href: '/finance/refunds', label: 'Hoàn tiền', permission: 'FINANCE' },
  { href: '/finance/adjustments', label: 'Điều chỉnh', permission: 'FINANCE' },
  { href: '/reports/sales', label: 'Báo cáo doanh thu', permission: 'SALES_REPORTS' },
  { href: '/reports/topups', label: 'Báo cáo nạp tiền', permission: 'FINANCE_REPORTS' },
  { href: '/reports/balances', label: 'Tổng số dư', permission: 'FINANCE_REPORTS' },
  { href: '/reports/reconciliation', label: 'Đối soát', permission: 'FINANCE_REPORTS' },
  { href: '/audit', label: 'Nhật ký thao tác', permission: 'SYSTEM' },
  { href: '/kiosks', label: 'Thiết bị kiosk', permission: 'SYSTEM' },
  { href: '/settings', label: 'Cài đặt', permission: 'SYSTEM' },
];

export function navFor(role: Role): NavItem[] {
  return NAV.filter((item) => can(role, item.permission));
}
