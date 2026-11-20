import type {
  CardStatus,
  LedgerType,
  OrderStatus,
  RefundMethod,
  RequestStatus,
  Role,
  SepayTxStatus,
  TopUpStatus,
  UserStatus,
} from '@schoolcoin/types';

/**
 * Vietnamese labels + a semantic tone for every enum the UI renders. Pair the
 * tone with <Badge tone={…}>. Keep wording here so all four apps agree.
 */
export type Tone = 'neutral' | 'brand' | 'success' | 'danger' | 'info' | 'warning';

export interface Labelled {
  label: string;
  tone: Tone;
}

export const ROLE_LABEL: Record<Role, string> = {
  PARENT: 'Phụ huynh',
  CASHIER: 'Thu ngân',
  CAFE_MANAGER: 'Quản lý căng tin',
  ACCOUNTANT: 'Kế toán',
  ADMIN: 'Hội đồng trường',
};

export const USER_STATUS: Record<UserStatus, Labelled> = {
  ACTIVE: { label: 'Đang hoạt động', tone: 'success' },
  LOCKED: { label: 'Tạm khóa', tone: 'warning' },
  DEACTIVATED: { label: 'Ngừng hoạt động', tone: 'neutral' },
};

export const CARD_STATUS: Record<CardStatus, Labelled> = {
  ACTIVE: { label: 'Đang dùng', tone: 'success' },
  LOCKED: { label: 'Đã khóa', tone: 'danger' },
  REPLACED: { label: 'Đã thay', tone: 'neutral' },
};

export const LEDGER_TYPE: Record<LedgerType, Labelled> = {
  TOPUP_SEPAY: { label: 'Nạp chuyển khoản', tone: 'success' },
  TOPUP_CASH: { label: 'Nạp tiền mặt', tone: 'success' },
  PURCHASE: { label: 'Mua hàng', tone: 'neutral' },
  VOID_REVERSAL: { label: 'Hoàn đơn hủy', tone: 'info' },
  REFUND: { label: 'Hoàn tiền', tone: 'warning' },
  ADJUSTMENT: { label: 'Điều chỉnh', tone: 'info' },
};

export const TOPUP_STATUS: Record<TopUpStatus, Labelled> = {
  PENDING: { label: 'Chờ thanh toán', tone: 'warning' },
  PAID: { label: 'Đã thanh toán', tone: 'success' },
  EXPIRED: { label: 'Hết hạn', tone: 'neutral' },
  CANCELLED: { label: 'Đã hủy', tone: 'neutral' },
};

export const SEPAY_STATUS: Record<SepayTxStatus, Labelled> = {
  MATCHED: { label: 'Đã khớp', tone: 'success' },
  UNMATCHED: { label: 'Chưa khớp', tone: 'warning' },
  RESOLVED: { label: 'Đã gán', tone: 'info' },
  IGNORED: { label: 'Bỏ qua', tone: 'neutral' },
};

export const ORDER_STATUS: Record<OrderStatus, Labelled> = {
  COMPLETED: { label: 'Hoàn tất', tone: 'success' },
  VOIDED: { label: 'Đã hủy', tone: 'danger' },
};

export const REQUEST_STATUS: Record<RequestStatus, Labelled> = {
  PENDING: { label: 'Đang chờ', tone: 'warning' },
  APPROVED: { label: 'Đã đồng ý', tone: 'info' },
  DECLINED: { label: 'Đã từ chối', tone: 'danger' },
  EXPIRED: { label: 'Hết hạn', tone: 'neutral' },
  PAID: { label: 'Đã nạp', tone: 'success' },
};

export const REFUND_METHOD: Record<RefundMethod, string> = {
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản',
};
