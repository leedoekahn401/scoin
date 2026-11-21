import type { KioskCardInfo } from '@schoolcoin/api-client';

export type KioskStep =
  | { step: 'idle' }
  | { step: 'identifying'; cardCode: string }
  | { step: 'message'; message: string; cardCode: string | null }
  | { step: 'pin'; cardCode: string; info: KioskCardInfo }
  | { step: 'home' }
  | { step: 'request' }
  | { step: 'sent'; sentAmount: number };

export type KioskFlowState = KioskStep;

export type KioskFlowAction =
  | { type: 'SCAN'; cardCode: string }
  | { type: 'GO_MESSAGE'; message: string; cardCode?: string | null }
  | { type: 'GO_PIN'; cardCode: string; info: KioskCardInfo }
  | { type: 'GO_HOME' }
  | { type: 'GO_REQUEST' }
  | { type: 'GO_SENT'; sentAmount: number }
  | { type: 'GO_HOME_AFTER_SENT' }
  | { type: 'RESET_TO_IDLE' };

export const initialKioskFlowState: KioskFlowState = { step: 'idle' };

export function kioskFlowReducer(state: KioskFlowState, action: KioskFlowAction): KioskFlowState {
  switch (action.type) {
    case 'SCAN':
      return { step: 'identifying', cardCode: action.cardCode };
    case 'GO_MESSAGE':
      return { step: 'message', message: action.message, cardCode: action.cardCode ?? null };
    case 'GO_PIN':
      return { step: 'pin', cardCode: action.cardCode, info: action.info };
    case 'GO_HOME':
      return { step: 'home' };
    case 'GO_REQUEST':
      return { step: 'request' };
    case 'GO_SENT':
      return { step: 'sent', sentAmount: action.sentAmount };
    case 'GO_HOME_AFTER_SENT':
      return { step: 'home' };
    case 'RESET_TO_IDLE':
      return { step: 'idle' };
    default:
      return state;
  }
}
