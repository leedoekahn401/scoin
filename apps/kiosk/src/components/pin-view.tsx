'use client';

import type { KioskCardInfo } from '@schoolcoin/api-client';
import { isApiError } from '@schoolcoin/api-client';
import { useApi } from '@schoolcoin/api-client/react';
import { KIOSK_IDLE_SECONDS } from '@schoolcoin/types';
import { Avatar, Button, PinPad, errorMessage, givenName, useIdleTimer } from '@schoolcoin/ui';
import { useState } from 'react';

type Props = {
  cardCode: string;
  info: KioskCardInfo;
  onSignedIn: () => void;
  onCancel: () => void;
  onMessage: (message: string) => void;
};

export function PinView({ cardCode, info, onSignedIn, onCancel, onMessage }: Props) {
  const api = useApi();
  const [pinError, setPinError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [signingIn, setSigningIn] = useState(false);
  // No session exists yet, so idling here just returns to the scan screen.
  const left = useIdleTimer(KIOSK_IDLE_SECONDS, onCancel);

  const submit = async (pin: string) => {
    if (signingIn) return;
    setSigningIn(true);
    try {
      await api.kiosk.signIn({ cardCode, pin });
      onSignedIn();
    } catch (err) {
      if (isApiError(err, 'PIN_INVALID')) {
        setPinError(errorMessage(err));
        setResetKey((k) => k + 1);
      } else {
        onMessage(errorMessage(err));
      }
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="fade-in flex h-dvh items-center justify-center bg-paper-bg px-10">
      <div className="grid w-full max-w-5xl grid-cols-2 items-center gap-16">
        <div className="flex flex-col items-start">
          <Avatar name={info.fullName} src={info.photoUrl} size="2xl" />
          <p className="mt-8 font-display text-4xl font-semibold tracking-tight text-ink-fg">
            Chào {givenName(info.fullName)}
          </p>
          <p className="mt-2 text-xl text-ink-muted">
            {info.fullName} · Lớp {info.className}
          </p>
          <p className="mt-10 max-w-sm text-lg text-ink-muted">
            Nhập mã PIN 4 số của bạn. Che bàn phím khi nhập để giữ bí mật.
          </p>
          <Button size="xl" className="mt-8" onClick={onCancel}>
            Không phải tôi
          </Button>
        </div>
        <div className="workbook-panel flex flex-col items-center px-10 py-10">
          <p className="mb-6 font-display text-2xl font-semibold text-ink-fg">Nhập mã PIN</p>
          <PinPad
            size="lg"
            error={pinError}
            resetKey={resetKey}
            onComplete={submit}
            disabled={signingIn}
          />
        </div>
      </div>
      {left <= 10 && (
        <div className="fixed inset-x-0 bottom-0 border-t border-warning/30 bg-warning-tint px-6 py-4 text-center text-lg font-medium text-ink-fg">
          Quay lại màn hình chính sau <span className="tabular">{left}</span> giây
        </div>
      )}
    </div>
  );
}
