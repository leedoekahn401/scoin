'use client';

import { isApiError } from '@schoolcoin/api-client';
import { useApi, useSession } from '@schoolcoin/api-client/react';
import {
  AuthLayout,
  Button,
  DEMO_TOOLS,
  Field,
  Input,
  Notice,
  RedirectIfSignedIn,
  errorMessage,
} from '@schoolcoin/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z
  .object({
    fullName: z.string().trim().min(1, 'Nhập họ và tên'),
    email: z.string().trim().min(1, 'Nhập email').email('Email chưa đúng định dạng'),
    phone: z
      .string()
      .trim()
      .regex(/^0\d{9}$/, 'Nhập số điện thoại 10 chữ số, bắt đầu bằng 0'),
    password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
    confirmPassword: z.string().min(1, 'Nhập lại mật khẩu'),
    inviteCode: z.string().regex(/^[A-Z0-9]{8}$/, 'Mã mời gồm 8 ký tự, viết hoa'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Mật khẩu nhập lại không khớp',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  return (
    <RedirectIfSignedIn>
      <RegisterScreen />
    </RedirectIfSignedIn>
  );
}

function RegisterScreen() {
  const api = useApi();
  const session = useSession();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      inviteCode: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const result = await api.auth.registerParent({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        password: values.password,
        inviteCode: values.inviteCode,
      });
      session.setUser(result.user);
      router.replace('/');
    } catch (err) {
      if (isApiError(err, 'EMAIL_TAKEN')) {
        setError('email', { message: errorMessage(err) });
        return;
      }
      if (
        isApiError(err, 'INVITE_CODE_INVALID') ||
        isApiError(err, 'INVITE_EXPIRED') ||
        isApiError(err, 'INVITE_USED') ||
        isApiError(err, 'PARENT_LIMIT_REACHED')
      ) {
        setError('inviteCode', { message: errorMessage(err) });
        return;
      }
      setFormError(errorMessage(err));
    }
  });

  return (
    <AuthLayout
      product="Phụ huynh"
      title="Đăng ký tài khoản"
      description="Liên kết với học sinh bằng mã mời của nhà trường."
      footer={
        <span>
          Đã có tài khoản?{' '}
          <Link
            href="/login"
            className="font-semibold text-ink-fg underline decoration-brand underline-offset-4"
          >
            Đăng nhập
          </Link>
        </span>
      }
    >
      <form onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-4" noValidate>
        {formError && <Notice tone="danger">{formError}</Notice>}

        <Field label="Họ và tên" error={errors.fullName?.message}>
          {(props) => (
            <Input
              {...props}
              {...register('fullName')}
              autoComplete="name"
              placeholder="Nguyễn Văn A"
            />
          )}
        </Field>

        <Field label="Email" error={errors.email?.message}>
          {(props) => (
            <Input
              {...props}
              {...register('email')}
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              placeholder="ban@gmail.com"
            />
          )}
        </Field>

        <Field label="Số điện thoại" error={errors.phone?.message}>
          {(props) => (
            <Input
              {...props}
              {...register('phone')}
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={10}
              placeholder="0912345678"
            />
          )}
        </Field>

        <Field label="Mật khẩu" error={errors.password?.message}>
          {(props) => (
            <Input
              {...props}
              {...register('password')}
              type="password"
              autoComplete="new-password"
            />
          )}
        </Field>

        <Field label="Nhập lại mật khẩu" error={errors.confirmPassword?.message}>
          {(props) => (
            <Input
              {...props}
              {...register('confirmPassword')}
              type="password"
              autoComplete="new-password"
            />
          )}
        </Field>

        <Field
          label="Mã mời"
          hint="Nhà trường gửi mã mời cho từng học sinh"
          error={errors.inviteCode?.message}
        >
          {({ id, ...props }) => (
            <Controller
              control={control}
              name="inviteCode"
              render={({ field }) => (
                <Input
                  {...props}
                  id={id}
                  value={field.value}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  autoCapitalize="characters"
                  autoComplete="off"
                  maxLength={8}
                  placeholder="DEMO2026"
                  onChange={(event) =>
                    field.onChange(
                      event.target.value
                        .replace(/[^a-zA-Z0-9]/g, '')
                        .toUpperCase()
                        .slice(0, 8),
                    )
                  }
                />
              )}
            />
          )}
        </Field>
        {DEMO_TOOLS && <p className="-mt-2 text-xs text-ink-muted">Mã mời demo: DEMO2026</p>}

        <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting}>
          Đăng ký
        </Button>
      </form>
    </AuthLayout>
  );
}
