import { formatNumber } from '@schoolcoin/ui';

const ACTION_LABELS: Record<string, string> = {
  'card.issue': 'Cấp thẻ mới',
  'card.lock': 'Khóa thẻ',
  'card.replace': 'Thay thẻ',
  'controls.update': 'Cập nhật giới hạn chi tiêu',
  'family.unlink': 'Gỡ liên kết phụ huynh',
  'invite.create': 'Tạo mã mời',
  'kiosk.register': 'Đăng ký kiosk',
  'kiosk.revoke': 'Thu hồi kiosk',
  'menu.category_create': 'Tạo danh mục',
  'menu.category_update': 'Sửa danh mục',
  'menu.item_create': 'Tạo món mới',
  'menu.item_update': 'Sửa món',
  'menu.price_change': 'Đổi giá món',
  'order.void': 'Hủy đơn hàng',
  'pin.reset': 'Đặt lại mã PIN',
  'pin.set': 'Đặt mã PIN',
  'sepay.assign': 'Gán giao dịch chuyển khoản',
  'sepay.ignore': 'Bỏ qua giao dịch chuyển khoản',
  'settings.update': 'Cập nhật cài đặt',
  'student.create': 'Thêm học sinh',
  'student.deactivate': 'Ngừng kích hoạt học sinh',
  'student.import': 'Nhập danh sách học sinh',
  'student.update': 'Sửa thông tin học sinh',
  'topup.cash': 'Nạp tiền mặt',
  'topup.reviewed': 'Duyệt lượt nạp',
  'user.create': 'Tạo nhân viên',
  'user.role_change': 'Đổi vai trò',
  'user.update': 'Sửa nhân viên',
  'wallet.adjust': 'Điều chỉnh số dư',
  'wallet.refund': 'Hoàn tiền',
};

export function auditActionLabel(action: string): string | null {
  return ACTION_LABELS[action] ?? null;
}

export interface ChangeEntry {
  key: string;
  from: string;
  to: string;
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Có' : 'Không';
  if (typeof value === 'number') return formatNumber(value);
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

export function changedEntries(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): ChangeEntry[] {
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  const entries: ChangeEntry[] = [];
  for (const key of keys) {
    const oldValue = before?.[key];
    const newValue = after?.[key];
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) continue;
    entries.push({ key, from: displayValue(oldValue), to: displayValue(newValue) });
  }
  return entries;
}
