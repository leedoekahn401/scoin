import { DB_VERSION, type DbState } from '@schoolcoin/mock-data';

import type { SchoolCoinApi } from '../contract';
import { ApiError } from '../errors';
import { TokenStore } from '../tokens';
import { MockEngine, type Ctx } from './engine';

const DB_KEY = 'schoolcoin.mock.db';

function loadDb(): DbState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(DB_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DbState;
    return parsed.version === DB_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

function saveDb(db: DbState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    // Quota or private mode: the demo keeps working in memory.
  }
}

/** A short, jittered delay so loading states are visible in mock mode too. */
function latency(min = 120, max = 320) {
  return new Promise<void>((resolve) => setTimeout(resolve, min + Math.random() * (max - min)));
}

/**
 * `SchoolCoinApi` backed by the in-browser `MockEngine`. Data persists in
 * localStorage per origin; open two tabs of the same app and they stay in
 * sync through the `storage` event.
 */
export function createMockApi(options: { kioskKey?: string } = {}): SchoolCoinApi {
  const tokens = new TokenStore();
  let engine: MockEngine | null = null;

  const getEngine = () => {
    if (!engine) {
      engine = new MockEngine(loadDb(), saveDb);
      saveDb(engine.db);
      if (typeof window !== 'undefined') {
        window.addEventListener('storage', (event) => {
          if (event.key === DB_KEY && engine) {
            const next = loadDb();
            if (next) engine.db = next;
          }
        });
      }
    }
    return engine;
  };

  const ctx = (): Ctx => ({
    accessToken: tokens.access,
    kioskKey: options.kioskKey ?? null,
    kioskSession: tokens.kiosk,
    ip: '127.0.0.1',
  });

  /** Run an engine call with latency; errors are already `ApiError`s. */
  async function call<T>(fn: (e: MockEngine, c: Ctx) => T): Promise<T> {
    await latency();
    try {
      return fn(getEngine(), ctx());
    } catch (error) {
      if (error instanceof ApiError && error.code === 'UNAUTHENTICATED') tokens.clearAccess();
      throw error;
    }
  }

  return {
    mode: 'mock',
    publicSettings: () => call((e) => e.publicSettings()),
    auth: {
      login: async (dto) => {
        const result = await call((e) => e.login(dto));
        tokens.setAccess(result.accessToken);
        return result;
      },
      logout: async () => {
        await call((e, c) => e.logout(c));
        tokens.clearAccess();
      },
      me: () => call((e, c) => e.me(c)),
      updateMe: (dto) => call((e, c) => e.updateMe(c, dto)),
      changePassword: (dto) => call((e, c) => e.changePassword(c, dto)),
      registerParent: async (dto) => {
        const result = await call((e) => e.registerParent(dto));
        tokens.setAccess(result.accessToken);
        return result;
      },
      forgotPassword: () => call((e) => e.forgotPassword()),
      resetPassword: () => call((e) => e.resetPassword()),
      hasSession: () => tokens.access !== null,
    },
    parent: {
      listChildren: () => call((e, c) => e.listChildren(c)),
      linkChild: (dto) => call((e, c) => e.linkChild(c, dto)),
      getChild: (id) => call((e, c) => e.getChild(c, id)),
      listTransactions: (id, q) => call((e, c) => e.listTransactions(c, id, q)),
      updateControls: (id, dto) => call((e, c) => e.updateControls(c, id, dto)),
      lockCard: (id) => call((e, c) => e.parentLockCard(c, id)),
      createTopUp: (dto) => call((e, c) => e.createTopUp(c, dto)),
      listTopUps: () => call((e, c) => e.listTopUps(c)),
      getTopUp: (id) => call((e, c) => e.getTopUp(c, id)),
      subscribeTopUp: (id, onEvent) => {
        // Stand-in for the SSE stream: poll the engine once a second.
        let done = false;
        const timer = setInterval(() => {
          if (done) return;
          const fresh = loadDb();
          const e = getEngine();
          if (fresh) e.db = fresh;
          const event = e.topUpEvent(id);
          if (event) {
            done = true;
            clearInterval(timer);
            onEvent(event);
          }
        }, 1000);
        return () => {
          done = true;
          clearInterval(timer);
        };
      },
      cancelTopUp: (id) => call((e, c) => e.cancelTopUp(c, id)),
      listRequests: (q) => call((e, c) => e.listRequests(c, q)),
      approveRequest: (id, amount) => call((e, c) => e.approveRequest(c, id, amount)),
      declineRequest: (id, dto) => call((e, c) => e.declineRequest(c, id, dto)),
    },
    notifications: {
      list: () => call((e, c) => e.listNotifications(c)),
      markRead: (id) => call((e, c) => e.markRead(c, id)),
      markAllRead: () => call((e, c) => e.markAllRead(c)),
    },
    pos: {
      getMenu: () => call((e, c) => e.getMenu(c)),
      lookup: (dto) => call((e, c) => e.lookup(c, dto)),
      createOrder: (dto) => call((e, c) => e.createOrder(c, dto)),
      listOrders: () => call((e, c) => e.listOrders(c)),
      voidOrder: (id, dto) => call((e, c) => e.voidOrder(c, id, dto)),
    },
    kiosk: {
      identify: (code) => call((e, c) => e.kioskIdentify(c, code)),
      signIn: async (dto) => {
        const session = await call((e, c) => e.kioskSignIn(c, dto));
        tokens.setKiosk(session.sessionToken);
        return session;
      },
      me: () => call((e, c) => e.kioskMe(c)),
      createRequest: (dto) => call((e, c) => e.kioskCreateRequest(c, dto)),
      signOut: async () => {
        await call((e, c) => e.kioskSignOut(c));
        tokens.clearKiosk();
      },
    },
    admin: {
      listStudents: (q) => call((e, c) => e.listStudents(c, q)),
      getStudent: (id) => call((e, c) => e.getStudent(c, id)),
      studentTransactions: (id, q) => call((e, c) => e.studentTransactions(c, id, q)),
      createStudent: (dto) => call((e, c) => e.createStudent(c, dto)),
      updateStudent: (id, dto) => call((e, c) => e.updateStudent(c, id, dto)),
      importStudents: (csv) => call((e, c) => e.importStudents(c, csv)),
      issueCard: (id) => call((e, c) => e.issueCard(c, id)),
      lockCard: (id) => call((e, c) => e.adminLockCard(c, id)),
      printCards: (ids) => call((e, c) => e.printCards(c, ids)),
      setPin: (id, pin) => call((e, c) => e.setPin(c, id, pin)),
      createInvite: (id) => call((e, c) => e.createInvite(c, id)),
      unlinkParent: (sid, pid) => call((e, c) => e.unlinkParent(c, sid, pid)),
      listUsers: (q) => call((e, c) => e.listUsers(c, q)),
      createUser: (dto) => call((e, c) => e.createUser(c, dto)),
      updateUser: (id, dto) => call((e, c) => e.updateUser(c, id, dto)),
      listMenu: () => call((e, c) => e.listMenu(c)),
      createCategory: (dto) => call((e, c) => e.createCategory(c, dto)),
      updateCategory: (id, dto) => call((e, c) => e.updateCategory(c, id, dto)),
      createItem: (dto) => call((e, c) => e.createItem(c, dto)),
      updateItem: (id, dto) => call((e, c) => e.updateItem(c, id, dto)),
      setSoldOut: (id, soldOut) => call((e, c) => e.setSoldOut(c, id, soldOut)),
      cashTopUp: (dto) => call((e, c) => e.cashTopUp(c, dto)),
      listSepayTransactions: (q) => call((e, c) => e.listSepayTransactions(c, q)),
      assignPayment: (id, dto) => call((e, c) => e.assignPayment(c, id, dto)),
      ignorePayment: (id, dto) => call((e, c) => e.ignorePayment(c, id, dto)),
      listTopUpsToReview: () => call((e, c) => e.listTopUpsToReview(c)),
      markTopUpReviewed: (id) => call((e, c) => e.markTopUpReviewed(c, id)),
      createRefund: (dto) => call((e, c) => e.createRefund(c, dto)),
      listRefunds: () => call((e, c) => e.listRefunds(c)),
      createAdjustment: (dto) => call((e, c) => e.createAdjustment(c, dto)),
      listAdjustments: () => call((e, c) => e.listAdjustments(c)),
      dashboard: () => call((e, c) => e.dashboard(c)),
      salesReport: (q) => call((e, c) => e.salesReport(c, q)),
      topUpReport: (q) => call((e, c) => e.topUpReport(c, q)),
      balancesReport: () => call((e, c) => e.balancesReport(c)),
      reconciliationReport: (q) => call((e, c) => e.reconciliationReport(c, q)),
      exportCsv: (kind, q) => call((e, c) => e.exportCsv(c, kind, q)),
      listAuditLogs: (q) => call((e, c) => e.listAuditLogs(c, q)),
      getSettings: () => call((e, c) => e.getSettings(c)),
      updateSettings: (dto) => call((e, c) => e.updateSettings(c, dto)),
      listKioskDevices: () => call((e, c) => e.listKioskDevices(c)),
      createKioskDevice: (dto) => call((e, c) => e.createKioskDevice(c, dto)),
      revokeKioskDevice: (id) => call((e, c) => e.revokeKioskDevice(c, id)),
    },
    dev: {
      simulateTransfer: (input) => call((e) => e.simulateTransfer(input)),
      demoCards: () => call((e) => e.demoCards()),
      reset: () => call((e) => e.reset()),
    },
  };
}
