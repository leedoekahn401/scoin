import { isApiError } from '@schoolcoin/api-client';
import type { ErrorCode } from '@schoolcoin/types';

import { formatCredits, formatTime } from './format';

/**
 * Vietnamese copy for every API error code. Screens call `errorMessage(err)`
 * and show the string; they never print `error.message` (that is the
 * server's English fallback and may leak internals).
 */
const MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_FAILED: 'Thông tin chưa hợp lệ, vui lòng kiểm tra lại.',
  UNAUTHENTICATED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này.',
  NOT_FOUND: 'Không tìm thấy dữ liệu.',
  CONFLICT: 'Dữ liệu đã thay đổi, vui lòng tải lại.',
  RATE_LIMITED: 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.',
  NETWORK_ERROR: 'Không kết nối được máy chủ. Kiểm tra mạng và thử lại.',
  NOT_IMPLEMENTED: 'Tính năng này chưa được hỗ trợ.',
  INTERNAL_ERROR: 'Hệ thống đang gặp sự cố, vui lòng thử lại.',

  INVALID_CREDENTIALS: 'Tên đăng nhập hoặc mật khẩu không đúng.',
  ACCOUNT_LOCKED: 'Tài khoản tạm khóa do đăng nhập sai nhiều lần.',
  ACCOUNT_DEACTIVATED: 'Tài khoản đã bị vô hiệu hóa. Liên hệ nhà trường.',
  EMAIL_TAKEN: 'Email này đã được đăng ký.',
  INVITE_CODE_INVALID: 'Mã mời không đúng.',
  INVITE_EXPIRED: 'Mã mời đã hết hạn. Liên hệ nhà trường để nhận mã mới.',
  INVITE_USED: 'Mã mời đã được sử dụng.',
  PARENT_LIMIT_REACHED: 'Học sinh này đã liên kết đủ hai phụ huynh.',
  ALREADY_LINKED: 'Bạn đã liên kết với học sinh này.',

  CARD_NOT_FOUND: 'Thẻ không hợp lệ — vui lòng đến văn phòng.',
  CARD_INACTIVE: 'Thẻ không hợp lệ — vui lòng đến văn phòng.',
  PIN_REQUIRED: 'Cần nhập mã PIN cho đơn hàng này.',
  PIN_INVALID: 'Mã PIN không đúng.',
  PIN_LOCKED: 'Mã PIN đang tạm khóa.',
  PIN_NOT_SET: 'Học sinh chưa có mã PIN — vui lòng đến văn phòng.',
  INSUFFICIENT_BALANCE: 'Không đủ số dư.',
  DAILY_LIMIT_REACHED: 'Đã đạt hạn mức chi tiêu trong ngày.',
  ITEM_UNAVAILABLE: 'Có món đã hết hoặc ngừng bán.',
  VOID_NOT_ALLOWED: 'Chỉ hủy được đơn trong ngày.',
  ORDER_ALREADY_VOIDED: 'Đơn này đã được hủy.',

  TOPUP_AMOUNT_OUT_OF_RANGE: 'Số xu nạp nằm ngoài giới hạn cho phép.',
  TOPUP_NOT_PENDING: 'Giao dịch nạp này không còn chờ thanh toán.',
  REQUEST_LIMIT_REACHED: 'Bạn chỉ gửi được tối đa 3 yêu cầu mỗi ngày.',
  REQUEST_CLOSED: 'Yêu cầu này đã được xử lý.',
  NO_PARENT_LINKED: 'Chưa có phụ huynh liên kết — vui lòng đến văn phòng.',
  WALLET_INACTIVE: 'Ví của học sinh đang bị khóa.',

  STUDENT_HAS_BALANCE: 'Học sinh còn số dư. Hãy hoàn tiền trước khi ngừng kích hoạt.',
  REFUND_EXCEEDS_BALANCE: 'Số xu hoàn vượt quá số dư.',
  ADJUSTMENT_NEGATIVE_BALANCE: 'Điều chỉnh này sẽ làm số dư âm.',
  PAYMENT_ALREADY_RESOLVED: 'Giao dịch đã được xử lý.',
  STUDENT_CODE_TAKEN: 'Mã học sinh đã tồn tại.',
  USERNAME_TAKEN: 'Tên đăng nhập đã tồn tại.',
  RESET_TOKEN_INVALID: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
  KIOSK_UNKNOWN: 'Thiết bị kiosk chưa được đăng ký.',
  KIOSK_SESSION_EXPIRED: 'Phiên kiosk đã hết hạn. Vui lòng quẹt thẻ lại.',
};

/** The Vietnamese sentence to show for any thrown value, with numbers filled in. */
export function errorMessage(error: unknown): string {
  if (!isApiError(error)) return MESSAGES.INTERNAL_ERROR;
  const d = (error.details ?? {}) as Record<string, number | string>;
  switch (error.code) {
    case 'INSUFFICIENT_BALANCE':
      return `Không đủ xu: số dư ${formatCredits(Number(d.balance))}, đơn ${formatCredits(Number(d.total))}.`;
    case 'DAILY_LIMIT_REACHED':
      return `Đã đạt hạn mức ngày: hôm nay chỉ còn ${formatCredits(Number(d.remainingToday))}.`;
    case 'PIN_INVALID':
      return `Mã PIN không đúng. Còn ${d.attemptsLeft} lần thử.`;
    case 'PIN_LOCKED':
    case 'ACCOUNT_LOCKED':
      return d.lockedUntil
        ? `${MESSAGES[error.code]} Thử lại sau ${formatTime(String(d.lockedUntil))}.`
        : MESSAGES[error.code];
    case 'TOPUP_AMOUNT_OUT_OF_RANGE':
      return `Số xu nạp phải từ ${formatCredits(Number(d.min))} đến ${formatCredits(Number(d.max))}.`;
    case 'REFUND_EXCEEDS_BALANCE':
      return `Số xu hoàn vượt số dư hiện có (${formatCredits(Number(d.balance))}).`;
    case 'STUDENT_HAS_BALANCE':
      return `Học sinh còn ${formatCredits(Number(d.balance))}. Hãy hoàn tiền trước khi ngừng kích hoạt.`;
    default:
      return MESSAGES[error.code] ?? MESSAGES.INTERNAL_ERROR;
  }
}
