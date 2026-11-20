/**
 * SchoolCoin mock API — a stand-in for the NestJS backend on :4010.
 *
 * Serves the exact SRS §B7 routes under /api/v1 using the same MockEngine the
 * browser mock uses, and persists state to .data/db.json so all four apps
 * share one database (run the apps with NEXT_PUBLIC_API_MODE=http). It also
 * exposes the real webhook route POST /api/v1/webhooks/sepay, so the backend
 * team can replay SePay payloads against it.
 *
 * Zero dependencies beyond the workspace: node:http + tsx.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ApiError } from '@schoolcoin/api-client';
import { MockEngine, type Ctx } from '@schoolcoin/api-client/mock/engine';
import { DB_VERSION, type DbState } from '@schoolcoin/mock-data';
import type { ErrorCode } from '@schoolcoin/types';

const PORT = Number(process.env.PORT ?? 4010);
const here = dirname(fileURLToPath(import.meta.url));
const DB_FILE = join(here, '..', '.data', 'db.json');

function load(): DbState | null {
  try {
    if (!existsSync(DB_FILE)) return null;
    const db = JSON.parse(readFileSync(DB_FILE, 'utf8')) as DbState;
    return db.version === DB_VERSION ? db : null;
  } catch {
    return null;
  }
}

let saveTimer: NodeJS.Timeout | null = null;
function save(db: DbState) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    mkdirSync(dirname(DB_FILE), { recursive: true });
    writeFileSync(DB_FILE, JSON.stringify(db));
  }, 100);
}

const engine = new MockEngine(load(), save);
save(engine.db);

/* ───────────────────────────── routing ───────────────────────────── */

interface Req {
  ctx: Ctx;
  params: Record<string, string>;
  query: URLSearchParams;
  body: Record<string, unknown>;
  headers: IncomingMessage['headers'];
}

type Handler = (req: Req, res: ServerResponse) => unknown;
const routes: { method: string; pattern: RegExp; keys: string[]; handler: Handler }[] = [];

function route(method: string, path: string, handler: Handler) {
  const keys: string[] = [];
  const pattern = new RegExp(
    `^${path.replace(/:([a-zA-Z]+)/g, (_, k: string) => {
      keys.push(k);
      return '([^/]+)';
    })}$`,
  );
  routes.push({ method, pattern, keys, handler });
}

const num = (v: string | null) => (v === null || v === '' ? undefined : Number(v));
const str = (v: string | null) => (v === null || v === '' ? undefined : v);
const bool = (v: string | null) => (v === null || v === '' ? undefined : v === 'true');
// The engine validates DTO shapes itself, so bodies pass through untyped here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const b = (r: Req) => r.body as any;
const range = (q: URLSearchParams) => ({ from: q.get('from') ?? '', to: q.get('to') ?? '' });

// Settings
route('GET', '/settings/public', () => engine.publicSettings());

// Auth
route('POST', '/auth/login', (r) => engine.login(b(r)));
route('POST', '/auth/refresh', (r) => {
  // The mock's access token never expires; echo it back so the client's refresh path is exercised.
  if (!r.ctx.accessToken) throw new ApiError('UNAUTHENTICATED', 'No session', 401);
  return { accessToken: r.ctx.accessToken };
});
route('POST', '/auth/logout', (r) => engine.logout(r.ctx));
route('POST', '/auth/register-parent', (r) => engine.registerParent(b(r)));
route('POST', '/auth/forgot-password', () => engine.forgotPassword());
route('POST', '/auth/reset-password', () => engine.resetPassword());
route('GET', '/me', (r) => engine.me(r.ctx));
route('PATCH', '/me', (r) => engine.updateMe(r.ctx, b(r)));
route('POST', '/me/password', (r) => engine.changePassword(r.ctx, b(r)));

// Parent
route('GET', '/parent/children', (r) => engine.listChildren(r.ctx));
route('POST', '/parent/children/link', (r) => engine.linkChild(r.ctx, b(r)));
route('GET', '/parent/children/:id', (r) => engine.getChild(r.ctx, r.params.id!));
route('GET', '/parent/children/:id/transactions', (r) =>
  engine.listTransactions(r.ctx, r.params.id!, {
    from: str(r.query.get('from')),
    to: str(r.query.get('to')),
    type: str(r.query.get('type')) as never,
    page: num(r.query.get('page')),
    pageSize: num(r.query.get('pageSize')),
  }),
);
route('PATCH', '/parent/children/:id/controls', (r) =>
  engine.updateControls(r.ctx, r.params.id!, b(r)),
);
route('POST', '/parent/children/:id/card/lock', (r) => engine.parentLockCard(r.ctx, r.params.id!));
route('POST', '/parent/topups', (r) => engine.createTopUp(r.ctx, b(r)));
route('GET', '/parent/topups', (r) => engine.listTopUps(r.ctx));
route('GET', '/parent/topups/:id', (r) => engine.getTopUp(r.ctx, r.params.id!));
route('GET', '/parent/topups/:id/events', (r, res) => {
  engine.getTopUp(r.ctx, r.params.id!); // auth + ownership check
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    ...cors(r.headers.origin),
  });
  res.write(': connected\n\n');
  const timer = setInterval(() => {
    const event = engine.topUpEvent(r.params.id!);
    if (event) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
      clearInterval(timer);
      res.end();
    } else res.write(': ping\n\n');
  }, 1000);
  res.on('close', () => clearInterval(timer));
  return STREAMING;
});
route('POST', '/parent/topups/:id/cancel', (r) => engine.cancelTopUp(r.ctx, r.params.id!));
route('GET', '/parent/requests', (r) =>
  engine.listRequests(r.ctx, { status: str(r.query.get('status')) as never }),
);
route('POST', '/parent/requests/:id/approve', (r) =>
  engine.approveRequest(r.ctx, r.params.id!, b(r).amountCredits),
);
route('POST', '/parent/requests/:id/decline', (r) =>
  engine.declineRequest(r.ctx, r.params.id!, b(r)),
);

// Notifications
route('GET', '/notifications', (r) => engine.listNotifications(r.ctx));
route('PATCH', '/notifications/:id/read', (r) => engine.markRead(r.ctx, r.params.id!));
route('POST', '/notifications/read-all', (r) => engine.markAllRead(r.ctx));

// POS
route('GET', '/pos/menu', (r) => engine.getMenu(r.ctx));
route('POST', '/pos/lookup', (r) => engine.lookup(r.ctx, b(r)));
route('POST', '/pos/orders', (r) => engine.createOrder(r.ctx, b(r)));
route('GET', '/pos/orders', (r) => engine.listOrders(r.ctx));
route('POST', '/pos/orders/:id/void', (r) => engine.voidOrder(r.ctx, r.params.id!, b(r)));

// Kiosk
route('POST', '/kiosk/cards/identify', (r) =>
  engine.kioskIdentify(r.ctx, String(b(r).cardCode ?? '')),
);
route('POST', '/kiosk/sessions', (r) => engine.kioskSignIn(r.ctx, b(r)));
route('GET', '/kiosk/me', (r) => engine.kioskMe(r.ctx));
route('POST', '/kiosk/requests', (r) => engine.kioskCreateRequest(r.ctx, b(r)));
route('DELETE', '/kiosk/sessions/current', (r) => engine.kioskSignOut(r.ctx));

// Webhook (UC-23)
route('POST', '/webhooks/sepay', (r) => {
  const auth = String(r.headers.authorization ?? '');
  engine.sepayWebhook(auth.startsWith('Apikey ') ? auth.slice(7) : null, b(r));
  return { success: true };
});

// Admin — students, cards, families
route('GET', '/admin/students', (r) =>
  engine.listStudents(r.ctx, {
    search: str(r.query.get('search')),
    className: str(r.query.get('className')),
    active: bool(r.query.get('active')),
    page: num(r.query.get('page')),
    pageSize: num(r.query.get('pageSize')),
  }),
);
route('POST', '/admin/students', (r) => engine.createStudent(r.ctx, b(r)));
route('POST', '/admin/students/import', (r) =>
  engine.importStudents(r.ctx, String(b(r).csv ?? '')),
);
route('GET', '/admin/students/:id', (r) => engine.getStudent(r.ctx, r.params.id!));
route('PATCH', '/admin/students/:id', (r) => engine.updateStudent(r.ctx, r.params.id!, b(r)));
route('GET', '/admin/students/:id/transactions', (r) =>
  engine.studentTransactions(r.ctx, r.params.id!, {
    page: num(r.query.get('page')),
    pageSize: num(r.query.get('pageSize')),
  }),
);
route('POST', '/admin/students/:id/cards', (r) => engine.issueCard(r.ctx, r.params.id!));
route('PUT', '/admin/students/:id/pin', (r) =>
  engine.setPin(r.ctx, r.params.id!, String(b(r).pin ?? '')),
);
route('POST', '/admin/students/:id/invites', (r) => engine.createInvite(r.ctx, r.params.id!));
route('DELETE', '/admin/students/:id/parents/:parentId', (r) =>
  engine.unlinkParent(r.ctx, r.params.id!, r.params.parentId!),
);
route('POST', '/admin/cards/:id/lock', (r) => engine.adminLockCard(r.ctx, r.params.id!));
route('GET', '/admin/cards/print', (r) =>
  engine.printCards(r.ctx, (r.query.get('studentIds') ?? '').split(',').filter(Boolean)),
);

// Admin — staff
route('GET', '/admin/users', (r) =>
  engine.listUsers(r.ctx, {
    role: str(r.query.get('role')) as never,
    search: str(r.query.get('search')),
    page: num(r.query.get('page')),
    pageSize: num(r.query.get('pageSize')),
  }),
);
route('POST', '/admin/users', (r) => engine.createUser(r.ctx, b(r)));
route('PATCH', '/admin/users/:id', (r) => engine.updateUser(r.ctx, r.params.id!, b(r)));

// Admin — menu
route('GET', '/admin/menu/categories', (r) => engine.listMenu(r.ctx));
route('POST', '/admin/menu/categories', (r) => engine.createCategory(r.ctx, b(r)));
route('PATCH', '/admin/menu/categories/:id', (r) =>
  engine.updateCategory(r.ctx, r.params.id!, b(r)),
);
route('POST', '/admin/menu/items', (r) => engine.createItem(r.ctx, b(r)));
route('PATCH', '/admin/menu/items/:id', (r) => engine.updateItem(r.ctx, r.params.id!, b(r)));
route('POST', '/admin/menu/items/:id/sold-out', (r) =>
  engine.setSoldOut(r.ctx, r.params.id!, true),
);
route('DELETE', '/admin/menu/items/:id/sold-out', (r) =>
  engine.setSoldOut(r.ctx, r.params.id!, false),
);

// Admin — money
route('POST', '/admin/topups/cash', (r) => engine.cashTopUp(r.ctx, b(r)));
route('GET', '/admin/sepay-transactions', (r) =>
  engine.listSepayTransactions(r.ctx, {
    status: str(r.query.get('status')) as never,
    from: str(r.query.get('from')),
    to: str(r.query.get('to')),
    page: num(r.query.get('page')),
    pageSize: num(r.query.get('pageSize')),
  }),
);
route('POST', '/admin/sepay-transactions/:id/assign', (r) =>
  engine.assignPayment(r.ctx, r.params.id!, b(r)),
);
route('POST', '/admin/sepay-transactions/:id/ignore', (r) =>
  engine.ignorePayment(r.ctx, r.params.id!, b(r)),
);
route('GET', '/admin/topups/review', (r) => engine.listTopUpsToReview(r.ctx));
route('POST', '/admin/topups/:id/reviewed', (r) => engine.markTopUpReviewed(r.ctx, r.params.id!));
route('POST', '/admin/refunds', (r) => engine.createRefund(r.ctx, b(r)));
route('GET', '/admin/refunds', (r) => engine.listRefunds(r.ctx));
route('POST', '/admin/adjustments', (r) => engine.createAdjustment(r.ctx, b(r)));
route('GET', '/admin/adjustments', (r) => engine.listAdjustments(r.ctx));

// Admin — reports (?format=csv on the four range reports)
route('GET', '/admin/reports/dashboard', (r) => engine.dashboard(r.ctx));
const report =
  (kind: 'sales' | 'topups' | 'balances' | 'reconciliation', json: (r: Req) => unknown) =>
  (r: Req, res: ServerResponse) => {
    if (r.query.get('format') !== 'csv') return json(r);
    const csv = engine.exportCsv(r.ctx, kind, r.query.get('from') ? range(r.query) : undefined);
    res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', ...cors(r.headers.origin) });
    res.end(csv);
    return STREAMING;
  };
route(
  'GET',
  '/admin/reports/sales',
  report('sales', (r) => engine.salesReport(r.ctx, range(r.query))),
);
route(
  'GET',
  '/admin/reports/topups',
  report('topups', (r) => engine.topUpReport(r.ctx, range(r.query))),
);
route(
  'GET',
  '/admin/reports/balances',
  report('balances', (r) => engine.balancesReport(r.ctx)),
);
route(
  'GET',
  '/admin/reports/reconciliation',
  report('reconciliation', (r) => engine.reconciliationReport(r.ctx, range(r.query))),
);

// Admin — audit, settings, kiosk devices
route('GET', '/admin/audit-logs', (r) =>
  engine.listAuditLogs(r.ctx, {
    actorId: str(r.query.get('actorId')),
    action: str(r.query.get('action')),
    entity: str(r.query.get('entity')),
    from: str(r.query.get('from')),
    to: str(r.query.get('to')),
    page: num(r.query.get('page')),
    pageSize: num(r.query.get('pageSize')),
  }),
);
route('GET', '/admin/settings', (r) => engine.getSettings(r.ctx));
route('PUT', '/admin/settings', (r) => engine.updateSettings(r.ctx, b(r)));
route('GET', '/admin/kiosk-devices', (r) => engine.listKioskDevices(r.ctx));
route('POST', '/admin/kiosk-devices', (r) => engine.createKioskDevice(r.ctx, b(r)));
route('DELETE', '/admin/kiosk-devices/:id', (r) => engine.revokeKioskDevice(r.ctx, r.params.id!));

// Demo-only
route('POST', '/dev/simulate-transfer', (r) => engine.simulateTransfer(b(r)));
route('GET', '/dev/demo-cards', () => engine.demoCards());
route('POST', '/dev/reset', () => engine.reset());

/* ───────────────────────────── server ───────────────────────────── */

const STREAMING = Symbol('streaming');

function cors(origin: string | undefined): Record<string, string> {
  // Dev server: reflect any localhost origin so credentials (refresh cookie) work.
  const allowed =
    origin && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ? origin
      : 'http://localhost:3001';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization,Content-Type,X-Kiosk-Key,X-Kiosk-Session,Accept',
    Vary: 'Origin',
  };
}

function send(res: ServerResponse, origin: string | undefined, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...cors(origin) });
  res.end(body === undefined ? '' : JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
  } catch {
    throw new ApiError('VALIDATION_FAILED' as ErrorCode, 'Body is not valid JSON', 400);
  }
}

createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors(origin));
    res.end();
    return;
  }
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  if (url.pathname === '/' || url.pathname === '/health') {
    send(res, origin, 200, { ok: true, service: 'schoolcoin-mock-api', routes: routes.length });
    return;
  }
  const path = url.pathname.replace(/^\/api\/v1/, '');
  const match = routes
    .filter((r) => r.method === req.method)
    .map((r) => ({ r, m: r.pattern.exec(path) }))
    .find((x) => x.m);
  if (!match) {
    send(res, origin, 404, {
      error: { code: 'NOT_FOUND', message: `No route ${req.method} ${path}` },
    });
    return;
  }
  const started = Date.now();
  try {
    const params: Record<string, string> = {};
    match.r.keys.forEach((k, i) => (params[k] = decodeURIComponent(match.m![i + 1]!)));
    const authHeader = String(req.headers.authorization ?? '');
    const ctx: Ctx = {
      accessToken: authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null,
      kioskKey: (req.headers['x-kiosk-key'] as string | undefined) ?? null,
      kioskSession: (req.headers['x-kiosk-session'] as string | undefined) ?? null,
      ip: req.socket.remoteAddress ?? null,
    };
    const body = req.method === 'GET' || req.method === 'DELETE' ? {} : await readBody(req);
    // A little latency keeps loading states honest.
    await new Promise((r) => setTimeout(r, 80 + Math.random() * 120));
    const result = await match.r.handler(
      { ctx, params, query: url.searchParams, body, headers: req.headers },
      res,
    );
    if (result === STREAMING) return;
    const status =
      req.method === 'POST' &&
      /\/(orders|students|users|topups|refunds|adjustments|kiosk-devices|invites|cards|items|categories)$/.test(
        path,
      )
        ? 201
        : 200;
    send(res, origin, result === undefined || result === null ? 204 : status, result ?? undefined);
    console.log(`${req.method} ${path} → ${status} ${Date.now() - started}ms`);
  } catch (error) {
    if (error instanceof ApiError) {
      send(res, origin, error.status, error.toBody());
      console.log(`${req.method} ${path} → ${error.status} ${error.code}`);
    } else {
      console.error(error);
      send(res, origin, 500, { error: { code: 'INTERNAL_ERROR', message: 'Internal error' } });
    }
  }
}).listen(PORT, () => {
  console.log(
    `SchoolCoin mock API on http://localhost:${PORT}/api/v1 (${routes.length} routes, db ${DB_FILE})`,
  );
});
