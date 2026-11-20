import type {
  Adjustment,
  AssignPaymentDto,
  AuditLogPage,
  AuditLogQuery,
  BalancesReport,
  Card,
  CashTopUpDto,
  CashTopUpReceipt,
  ChangePasswordDto,
  ChildDetail,
  ChildSummary,
  CreateAdjustmentDto,
  CreateCategoryDto,
  CreateInviteResult,
  CreateKioskDeviceDto,
  CreateKioskDeviceResult,
  CreateMenuItemDto,
  CreateOrderDto,
  CreateOrderResult,
  CreateRefundDto,
  CreateStudentDto,
  CreateTopUpDto,
  CreateUserDto,
  CreditRequest,
  DashboardReport,
  DeclineRequestDto,
  ForgotPasswordDto,
  IgnorePaymentDto,
  ImportStudentsResult,
  KioskCreateRequestDto,
  KioskDevice,
  KioskMe,
  KioskSession,
  KioskSignInDto,
  LinkChildDto,
  LoginDto,
  LoginResult,
  Me,
  MenuCategory,
  MenuCategoryWithItems,
  MenuItem,
  Notification,
  Order,
  Paginated,
  PageQuery,
  PosLookupDto,
  PosLookupResult,
  PrintableCard,
  ReconciliationReport,
  Refund,
  RegisterParentDto,
  ReportRangeQuery,
  RequestsQuery,
  ResetPasswordDto,
  SalesReport,
  SepayTransaction,
  SepayTransactionsQuery,
  Settings,
  StudentDetailAdmin,
  StudentListItem,
  StudentsQuery,
  Student,
  TopUp,
  TopUpCheckout,
  TopUpEvent,
  TopUpReport,
  TopUpReviewItem,
  Transaction,
  TransactionsQuery,
  UpdateCategoryDto,
  UpdateControlsDto,
  UpdateMeDto,
  UpdateMenuItemDto,
  UpdateStudentDto,
  UpdateUserDto,
  UserProfile,
  UsersQuery,
  VoidOrderDto,
} from '@schoolcoin/types';

/**
 * THE front-end ↔ back-end contract. Every screen talks to the backend only
 * through this interface, obtained from `useApi()`. Two implementations exist:
 *
 *   - `HttpApi`  — fetch against the NestJS API (`/api/v1`, SRS §B7).
 *   - `MockApi`  — the same business rules running in the browser on seed data.
 *
 * Method → endpoint mapping lives next to each method so the backend team can
 * read this file as the list of routes the front-ends call.
 */

export interface PublicSettings {
  pinThresholdCredits: number;
  topUpMinCredits: number;
  topUpMaxCredits: number;
  topUpExpiryMinutes: number;
}

export interface NotificationList {
  items: Notification[];
  unreadCount: number;
}

export interface AuthApi {
  /** POST /auth/login */
  login(dto: LoginDto): Promise<LoginResult>;
  /** POST /auth/logout */
  logout(): Promise<void>;
  /** GET /me */
  me(): Promise<Me>;
  /** PATCH /me */
  updateMe(dto: UpdateMeDto): Promise<Me>;
  /** POST /me/password */
  changePassword(dto: ChangePasswordDto): Promise<void>;
  /** POST /auth/register-parent */
  registerParent(dto: RegisterParentDto): Promise<LoginResult>;
  /** POST /auth/forgot-password */
  forgotPassword(dto: ForgotPasswordDto): Promise<void>;
  /** POST /auth/reset-password */
  resetPassword(dto: ResetPasswordDto): Promise<void>;
  /** True when a stored access token exists (no network). */
  hasSession(): boolean;
}

export interface ParentApi {
  /** GET /parent/children */
  listChildren(): Promise<ChildSummary[]>;
  /** POST /parent/children/link */
  linkChild(dto: LinkChildDto): Promise<ChildSummary>;
  /** GET /parent/children/:studentId */
  getChild(studentId: string): Promise<ChildDetail>;
  /** GET /parent/children/:studentId/transactions */
  listTransactions(studentId: string, query?: TransactionsQuery): Promise<Paginated<Transaction>>;
  /** PATCH /parent/children/:studentId/controls */
  updateControls(studentId: string, dto: UpdateControlsDto): Promise<ChildDetail>;
  /** POST /parent/children/:studentId/card/lock */
  lockCard(studentId: string): Promise<ChildDetail>;
  /** POST /parent/topups */
  createTopUp(dto: CreateTopUpDto): Promise<TopUpCheckout>;
  /** GET /parent/topups */
  listTopUps(): Promise<TopUp[]>;
  /** GET /parent/topups/:id */
  getTopUp(id: string): Promise<TopUpCheckout>;
  /**
   * GET /parent/topups/:id/events (SSE). Calls `onEvent` once with PAID or
   * EXPIRED. Returns an unsubscribe function.
   */
  subscribeTopUp(id: string, onEvent: (event: TopUpEvent) => void): () => void;
  /** POST /parent/topups/:id/cancel */
  cancelTopUp(id: string): Promise<TopUp>;
  /** GET /parent/requests?status */
  listRequests(query?: RequestsQuery): Promise<CreditRequest[]>;
  /** POST /parent/requests/:id/approve — returns the started top-up. */
  approveRequest(id: string, amountCredits?: number): Promise<TopUpCheckout>;
  /** POST /parent/requests/:id/decline */
  declineRequest(id: string, dto: DeclineRequestDto): Promise<CreditRequest>;
}

export interface NotificationsApi {
  /** GET /notifications */
  list(): Promise<NotificationList>;
  /** PATCH /notifications/:id/read */
  markRead(id: string): Promise<void>;
  /** POST /notifications/read-all */
  markAllRead(): Promise<void>;
}

export interface PosApi {
  /** GET /pos/menu — categories with available items only (FR-POS-01). */
  getMenu(): Promise<MenuCategoryWithItems[]>;
  /** POST /pos/lookup */
  lookup(dto: PosLookupDto): Promise<PosLookupResult>;
  /** POST /pos/orders — 422 with an ErrorCode on decline. */
  createOrder(dto: CreateOrderDto): Promise<CreateOrderResult>;
  /** GET /pos/orders — today's orders (own; all for a manager). */
  listOrders(): Promise<Order[]>;
  /** POST /pos/orders/:id/void */
  voidOrder(id: string, dto: VoidOrderDto): Promise<Order>;
}

export interface KioskCardInfo {
  fullName: string;
  className: string;
  photoUrl: string | null;
  pinLockedUntil: string | null;
  hasPin: boolean;
}

export interface KioskApi {
  /** POST /kiosk/cards/identify (addition) — greet the student before the PIN pad. */
  identify(cardCode: string): Promise<KioskCardInfo>;
  /** POST /kiosk/sessions — stores the session token internally. */
  signIn(dto: KioskSignInDto): Promise<KioskSession>;
  /** GET /kiosk/me */
  me(): Promise<KioskMe>;
  /** POST /kiosk/requests */
  createRequest(dto: KioskCreateRequestDto): Promise<CreditRequest>;
  /** DELETE /kiosk/sessions/current */
  signOut(): Promise<void>;
}

export interface AdminApi {
  // Students, cards, PINs, families (UC-18, UC-20)
  /** GET /admin/students */
  listStudents(query?: StudentsQuery): Promise<Paginated<StudentListItem>>;
  /** GET /admin/students/:id */
  getStudent(id: string): Promise<StudentDetailAdmin>;
  /** GET /admin/students/:id/transactions (addition, see docs/API-NOTES.md) */
  studentTransactions(id: string, query?: PageQuery): Promise<Paginated<Transaction>>;
  /** POST /admin/students */
  createStudent(dto: CreateStudentDto): Promise<Student>;
  /** PATCH /admin/students/:id */
  updateStudent(id: string, dto: UpdateStudentDto): Promise<Student>;
  /** POST /admin/students/import */
  importStudents(csv: string): Promise<ImportStudentsResult>;
  /** POST /admin/students/:id/cards */
  issueCard(studentId: string): Promise<Card>;
  /** POST /admin/cards/:id/lock */
  lockCard(cardId: string): Promise<Card>;
  /** GET /admin/cards/print?studentIds=… */
  printCards(studentIds: string[]): Promise<PrintableCard[]>;
  /** PUT /admin/students/:id/pin */
  setPin(studentId: string, pin: string): Promise<void>;
  /** POST /admin/students/:id/invites */
  createInvite(studentId: string): Promise<CreateInviteResult>;
  /** DELETE /admin/students/:id/parents/:parentId */
  unlinkParent(studentId: string, parentId: string): Promise<void>;

  // Staff (UC-13, UC-19)
  /** GET /admin/users */
  listUsers(query?: UsersQuery): Promise<Paginated<UserProfile>>;
  /** POST /admin/users */
  createUser(dto: CreateUserDto): Promise<UserProfile>;
  /** PATCH /admin/users/:id */
  updateUser(id: string, dto: UpdateUserDto): Promise<UserProfile>;

  // Menu (UC-12)
  /** GET /admin/menu/categories — every category with every item, archived included. */
  listMenu(): Promise<MenuCategoryWithItems[]>;
  /** POST /admin/menu/categories */
  createCategory(dto: CreateCategoryDto): Promise<MenuCategory>;
  /** PATCH /admin/menu/categories/:id */
  updateCategory(id: string, dto: UpdateCategoryDto): Promise<MenuCategory>;
  /** POST /admin/menu/items */
  createItem(dto: CreateMenuItemDto): Promise<MenuItem>;
  /** PATCH /admin/menu/items/:id */
  updateItem(id: string, dto: UpdateMenuItemDto): Promise<MenuItem>;
  /** POST /admin/menu/items/:id/sold-out  (soldOut=false → DELETE) */
  setSoldOut(id: string, soldOut: boolean): Promise<MenuItem>;

  // Money (UC-14, UC-15, UC-16)
  /** POST /admin/topups/cash */
  cashTopUp(dto: CashTopUpDto): Promise<CashTopUpReceipt>;
  /** GET /admin/sepay-transactions */
  listSepayTransactions(query?: SepayTransactionsQuery): Promise<Paginated<SepayTransaction>>;
  /** POST /admin/sepay-transactions/:id/assign */
  assignPayment(id: string, dto: AssignPaymentDto): Promise<SepayTransaction>;
  /** POST /admin/sepay-transactions/:id/ignore */
  ignorePayment(id: string, dto: IgnorePaymentDto): Promise<SepayTransaction>;
  /** GET /admin/topups/review */
  listTopUpsToReview(): Promise<TopUpReviewItem[]>;
  /** POST /admin/topups/:id/reviewed (addition) */
  markTopUpReviewed(id: string): Promise<TopUp>;
  /** POST /admin/refunds */
  createRefund(dto: CreateRefundDto): Promise<Refund>;
  /** GET /admin/refunds (addition) */
  listRefunds(): Promise<Refund[]>;
  /** POST /admin/adjustments */
  createAdjustment(dto: CreateAdjustmentDto): Promise<Adjustment>;
  /** GET /admin/adjustments (addition) */
  listAdjustments(): Promise<Adjustment[]>;

  // Reports (UC-17)
  /** GET /admin/reports/dashboard */
  dashboard(): Promise<DashboardReport>;
  /** GET /admin/reports/sales?from&to */
  salesReport(query: ReportRangeQuery): Promise<SalesReport>;
  /** GET /admin/reports/topups?from&to */
  topUpReport(query: ReportRangeQuery): Promise<TopUpReport>;
  /** GET /admin/reports/balances */
  balancesReport(): Promise<BalancesReport>;
  /** GET /admin/reports/reconciliation?from&to */
  reconciliationReport(query: ReportRangeQuery): Promise<ReconciliationReport>;
  /** GET /admin/reports/:kind?format=csv — returns CSV text. */
  exportCsv(
    kind: 'sales' | 'topups' | 'balances' | 'reconciliation',
    query?: ReportRangeQuery,
  ): Promise<string>;

  // Audit, settings, devices (UC-21, UC-22, FR-ADM-06)
  /** GET /admin/audit-logs */
  listAuditLogs(query?: AuditLogQuery): Promise<AuditLogPage>;
  /** GET /admin/settings */
  getSettings(): Promise<Settings>;
  /** PUT /admin/settings */
  updateSettings(dto: Settings): Promise<Settings>;
  /** GET /admin/kiosk-devices */
  listKioskDevices(): Promise<KioskDevice[]>;
  /** POST /admin/kiosk-devices */
  createKioskDevice(dto: CreateKioskDeviceDto): Promise<CreateKioskDeviceResult>;
  /** DELETE /admin/kiosk-devices/:id */
  revokeKioskDevice(id: string): Promise<void>;
}

/**
 * Demo-only helpers. In mock mode they run in the browser; in http mode they
 * call the mock API server's `/dev/*` routes. A real NestJS deployment does not
 * implement these, and the UI hides the controls unless `demoTools` is on.
 */
export interface DevApi {
  /** Mimics SePay Test mode's "Simulate transfer" → POST /webhooks/sepay. */
  simulateTransfer(input: { amountVnd: number; content: string }): Promise<SepayTransaction>;
  /** Card codes of seeded students, for the POS/kiosk scan simulator. */
  demoCards(): Promise<{ cardCode: string; fullName: string; className: string; pin: string }[]>;
  /** Wipe and reseed. */
  reset(): Promise<void>;
}

export interface SchoolCoinApi {
  readonly mode: 'mock' | 'http';
  /** GET /settings/public (addition) */
  publicSettings(): Promise<PublicSettings>;
  auth: AuthApi;
  parent: ParentApi;
  notifications: NotificationsApi;
  pos: PosApi;
  kiosk: KioskApi;
  admin: AdminApi;
  dev: DevApi;
}
