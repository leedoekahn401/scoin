'use client';

import { useApi } from '@schoolcoin/api-client/react';
import {
  AuthLayout,
  Button,
  Field,
  Input,
  Notice,
  RedirectIfSignedIn,
  errorMessage,
} from '@schoolcoin/ui';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';

export default function ForgotPasswordPage() {
  return (
    <RedirectIfSignedIn>
      <ForgotPasswordScreen />
    </RedirectIfSignedIn>
  );
}

function ForgotPasswordScreen() {
  const api = useApi();
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFieldError('Nhập email hợp lệ');
      return;
    }
    setFieldError(null);
    setFormError(null);
    setSubmitting(true);
    try {
      await api.auth.forgotPassword({ email: email.trim() });
      setSent(true);
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      product="Phụ huynh"
      title="Quên mật khẩu"
      description="Chúng tôi sẽ gửi liên kết đặt lại mật khẩu qua email."
      footer={
        <Link href="/login" className="text-ink-muted hover:text-ink-fg">
          Về đăng nhập
        </Link>
      }
    >
      {sent ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-12 items-center justify-center rounded-full border border-success/25 bg-success-tint text-success">
            <CheckCircle2 className="size-6" aria-hidden />
          </span>
          <p className="text-sm leading-relaxed text-ink-fg">
            Nếu email tồn tại, bạn sẽ nhận được liên kết đặt lại mật khẩu trong vài phút. Liên kết
            có hiệu lực 30 phút.
          </p>
          <Button
            variant="secondary"
            fullWidth
            className="mt-2"
            onClick={() => {
              setSent(false);
              setEmail('');
            }}
          >
            Gửi lại email khác
          </Button>
        </div>
      ) : (
        <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4" noValidate>
          {formError && <Notice tone="danger">{formError}</Notice>}
          <Field label="Email" error={fieldError ?? undefined}>
            {(props) => (
              <Input
                {...props}
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                placeholder="ban@gmail.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setFieldError(null);
                }}
              />
            )}
          </Field>
          <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
            Gửi liên kết đặt lại
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
