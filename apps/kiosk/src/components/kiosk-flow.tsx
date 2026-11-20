'use client';

import { useApi } from '@schoolcoin/api-client/react';
import { errorMessage, formatTime } from '@schoolcoin/ui';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useReducer } from 'react';

import { HomeView } from '@/components/home-view';
import { IdleView } from '@/components/idle-view';
import { initialKioskFlowState, kioskFlowReducer } from '@/components/kiosk-flow-reducer';
import { KioskSessionProvider } from '@/components/kiosk-session';
import { MessageView } from '@/components/message-view';
import { PinView } from '@/components/pin-view';
import { RequestView } from '@/components/request-view';
import { SentView } from '@/components/sent-view';

/** The kiosk is one screen driven by a small state machine (§B8 Kiosk). */
export function KioskFlow() {
  const api = useApi();
  const [state, dispatch] = useReducer(kioskFlowReducer, initialKioskFlowState);
  const toIdle = useCallback(() => dispatch({ type: 'RESET_TO_IDLE' }), []);
  const toHome = useCallback(() => dispatch({ type: 'GO_HOME' }), []);
  const showMessage = useCallback(
    (message: string) => dispatch({ type: 'GO_MESSAGE', message }),
    [],
  );

  const cardCode = state.step === 'identifying' ? state.cardCode : null;
  useEffect(() => {
    if (!cardCode) return;
    let cancelled = false;
    api.kiosk
      .identify(cardCode)
      .then((info) => {
        if (cancelled) return;
        if (info.pinLockedUntil) {
          showMessage(`Mã PIN đang tạm khóa. Thử lại sau ${formatTime(info.pinLockedUntil)}.`);
        } else if (!info.hasPin) {
          showMessage('Thẻ chưa có mã PIN — vui lòng đến văn phòng để đặt mã.');
        } else {
          dispatch({ type: 'GO_PIN', cardCode, info });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) showMessage(errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [api, cardCode, showMessage]);

  return (
    <KioskSessionProvider onSignedOut={toIdle}>
      {state.step === 'idle' && (
        <IdleView onScanned={(code) => dispatch({ type: 'SCAN', cardCode: code })} />
      )}
      {state.step === 'identifying' && (
        <div className="flex h-dvh items-center justify-center bg-paper-bg">
          <Loader2 className="size-10 animate-spin text-ink-muted" aria-label="Đang đọc thẻ" />
        </div>
      )}
      {state.step === 'message' && <MessageView message={state.message} onBack={toIdle} />}
      {state.step === 'pin' && (
        <PinView
          key={state.cardCode}
          cardCode={state.cardCode}
          info={state.info}
          onSignedIn={toHome}
          onCancel={toIdle}
          onMessage={showMessage}
        />
      )}
      {state.step === 'home' && <HomeView onGoRequest={() => dispatch({ type: 'GO_REQUEST' })} />}
      {state.step === 'request' && (
        <RequestView
          onBack={toHome}
          onSent={(amount) => dispatch({ type: 'GO_SENT', sentAmount: amount })}
        />
      )}
      {state.step === 'sent' && <SentView amount={state.sentAmount} onDone={toHome} />}
    </KioskSessionProvider>
  );
}
