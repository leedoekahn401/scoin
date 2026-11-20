'use client';

import { isWrongAppError, useSession } from '@schoolcoin/api-client/react';
import { useState, type FormEvent, type ReactNode } from 'react';

import { errorMessage } from '../lib/errors';
import { DEMO_TOOLS } from '../lib/env';
import { AuthLayout, DemoAccounts, type DemoAccountOption } from './auth';
import { Button } from './button';
import { Field, Input } from './form';
import { RedirectIfSignedIn } from './guard';
import { Notice } from './surface';

/**
 * The sign-in screen every app uses (FR-AUTH-01). Apps differ only in copy,
 * the identifier type (email vs cashier username) and which demo accounts
 * are offered.
 */
export function LoginScreen({
  product,
  title = 'Đăng nhập',
  description,
  identifierLabel = 'Email',
  identifierType = 'email',
  placeholder,
  wrongAppMessage,
  demoAccounts = [],
  home = '/',
  footer,
  size = 'md',
}: {
  product: string;
  title?: string;
  description?: string;
  identifierLabel?: string;
  identifierType?: 'email' | 'text';
  placeholder?: string;
  wrongAppMessage: string;
  demoAccounts?: DemoAccountOption[];
  home?: string;
  footer?: ReactNode;
  /** "lg" for touch screens (POS). */
  size?: 'md' | 'lg';
}) {
  const { signIn } = useSession();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(id: string, pw: string) {
    const errors = {
      identifier: id.trim() ? undefined : `Nhập ${identifierLabel.toLowerCase()}`,
      password: pw ? undefined : 'Nhập mật khẩu',
    };
    setFieldErrors(errors);
    if (errors.identifier || errors.password) return;
    setError(null);
    setSubmitting(true);
    try {
      await signIn(id.trim(), pw);
    } catch (err) {
      setError(isWrongAppError(err) ? wrongAppMessage : errorMessage(err));
      setSubmitting(false);
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submit(identifier, password);
  };

  const inputSize = size === 'lg' ? 'lg' : 'md';

  return (
    <RedirectIfSignedIn home={home}>
      <AuthLayout
        product={product}
        title={title}
        description={description}
        footer={footer}
        aside={
          DEMO_TOOLS && demoAccounts.length ? (
            <DemoAccounts
              accounts={demoAccounts}
              onPick={(a) => {
                setIdentifier(a.identifier);
                setPassword(a.password);
                void submit(a.identifier, a.password);
              }}
            />
          ) : undefined
        }
      >
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          {error && <Notice tone="danger">{error}</Notice>}
          <Field label={identifierLabel} error={fieldErrors.identifier}>
            {(p) => (
              <Input
                {...p}
                inputSize={inputSize}
                type={identifierType}
                autoComplete="username"
                autoCapitalize="none"
                placeholder={placeholder}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            )}
          </Field>
          <Field label="Mật khẩu" error={fieldErrors.password}>
            {(p) => (
              <Input
                {...p}
                inputSize={inputSize}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}
          </Field>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={submitting}
            className="mt-2"
          >
            Đăng nhập
          </Button>
        </form>
      </AuthLayout>
    </RedirectIfSignedIn>
  );
}
