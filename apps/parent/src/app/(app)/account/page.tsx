'use client';

import { isApiError } from '@schoolcoin/api-client';
import { useApi, useSession } from '@schoolcoin/api-client/react';
import type { EmailPrefs } from '@schoolcoin/types';
import {
  Button,
  Field,
  Input,
  LinkButton,
  PageHeader,
  Panel,
  PanelHeader,
  Switch,
  errorMessage,
  toast,
} from '@schoolcoin/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const DEFAULT_PREFS: EmailPrefs = {
  TOPUP_PAID: true,
  LOW_BALANCE: true,
  NEW_REQUEST: true,
  CARD_LOCKED: true,
};

const PREF_ROWS = [
  { key: 'TOPUP_PAID', label: 'Nạp xu thành công' },
  { key: 'LOW_BALANCE', label: 'Số dư xuống thấp' },
  { key: 'NEW_REQUEST', label: 'Con gửi yêu cầu xin xu' },
  { key: 'CARD_LOCKED', label: 'Thẻ của con bị khóa' },
] as const;

type PrefKey = (typeof PREF_ROWS)[number]['key'];

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Nhập mật khẩu hiện tại'),
    newPassword: z.string().min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự'),
    confirmPassword: z.string().min(1, 'Nhập lại mật khẩu mới'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Mật khẩu nhập lại không khớp',
    path: ['confirmPassword'],
  });

type PasswordValues = z.infer<typeof passwordSchema>;

export default function AccountPage() {
  const api = useApi();
  const session = useSession();
  const router = useRouter();
  const [fullName, setFullName] = useState(session.user?.fullName ?? '');
  const [phone, setPhone] = useState(session.user?.phone ?? '');
  const [prefs, setPrefs] = useState<EmailPrefs>(session.user?.emailPrefs ?? DEFAULT_PREFS);

  const profile = useMutation({
    mutationFn: async () => {
      const me = await api.auth.updateMe({ fullName: fullName.trim(), phone: phone.trim() });
      await session.refresh();
      return me;
    },
    onSuccess: () => toast.success('Đã lưu hồ sơ'),
    onError: (err) => toast.error(errorMessage(err)),
  });

  const emailPrefs = useMutation({
    mutationFn: async (next: EmailPrefs) => {
      await api.auth.updateMe({ emailPrefs: next });
      await session.refresh();
    },
    onSuccess: () => toast.success('Đã lưu tùy chọn thông báo'),
    onError: (err) => toast.error(errorMessage(err)),
  });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const changePassword = useMutation({
    mutationFn: (values: PasswordValues) =>
      api.auth.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }),
    onSuccess: () => {
      reset();
      toast.success('Đã đổi mật khẩu');
    },
    onError: (err) => {
      if (isApiError(err, 'INVALID_CREDENTIALS')) {
        setError('currentPassword', { message: 'Mật khẩu hiện tại không đúng' });
        return;
      }
      toast.error(errorMessage(err));
    },
  });

  async function logout() {
    await session.signOut();
    router.replace('/login');
  }

  function togglePref(key: PrefKey, checked: boolean) {
    const next = { ...prefs, [key]: checked };
    setPrefs(next);
    emailPrefs.mutate(next);
  }

  return (
    <>
      <PageHeader title="Tài khoản" description="Thông tin cá nhân và tùy chọn nhận thông báo." />

      <div className="flex flex-col gap-5">
        <Panel>
          <PanelHeader title="Hồ sơ" description="Thông tin liên lạc của phụ huynh" />
          <form
            className="flex flex-col gap-4 px-5 py-5"
            onSubmit={(event) => {
              event.preventDefault();
              profile.mutate();
            }}
          >
            <Field label="Họ và tên">
              {(props) => (
                <Input
                  {...props}
                  value={fullName}
                  autoComplete="name"
                  onChange={(event) => setFullName(event.target.value)}
                />
              )}
            </Field>
            <Field label="Email">
              {(props) => <Input {...props} value={session.user?.email ?? ''} readOnly />}
            </Field>
            <Field label="Số điện thoại">
              {(props) => (
                <Input
                  {...props}
                  value={phone}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={10}
                  onChange={(event) => setPhone(event.target.value)}
                />
              )}
            </Field>
            <div>
              <Button type="submit" variant="primary" size="lg" loading={profile.isPending}>
                Lưu thay đổi
              </Button>
            </div>
          </form>
        </Panel>

        <Panel>
          <PanelHeader
            title="Email thông báo"
            description="Chọn các sự kiện bạn muốn nhận qua email"
          />
          <div className="flex flex-col gap-4 px-5 py-5">
            {PREF_ROWS.map((row) => (
              <div key={row.key} className="flex items-center justify-between gap-3">
                <span className="text-sm text-ink-fg">{row.label}</span>
                <Switch
                  checked={prefs[row.key]}
                  onChange={(checked) => togglePref(row.key, checked)}
                  label={row.label}
                  disabled={emailPrefs.isPending}
                />
              </div>
            ))}
            <p className="text-[0.8125rem] text-ink-muted">Thông báo trong ứng dụng luôn bật</p>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Đổi mật khẩu" />
          <form
            className="flex flex-col gap-4 px-5 py-5"
            onSubmit={(event) =>
              void handleSubmit((values) => changePassword.mutate(values))(event)
            }
            noValidate
          >
            <Field label="Mật khẩu hiện tại" error={errors.currentPassword?.message}>
              {(props) => (
                <Input
                  {...props}
                  {...register('currentPassword')}
                  type="password"
                  autoComplete="current-password"
                />
              )}
            </Field>
            <Field label="Mật khẩu mới" error={errors.newPassword?.message}>
              {(props) => (
                <Input
                  {...props}
                  {...register('newPassword')}
                  type="password"
                  autoComplete="new-password"
                />
              )}
            </Field>
            <Field label="Nhập lại mật khẩu mới" error={errors.confirmPassword?.message}>
              {(props) => (
                <Input
                  {...props}
                  {...register('confirmPassword')}
                  type="password"
                  autoComplete="new-password"
                />
              )}
            </Field>
            <div>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isSubmitting || changePassword.isPending}
              >
                Đổi mật khẩu
              </Button>
            </div>
          </form>
        </Panel>

        <Panel>
          <PanelHeader title="Khác" />
          <div className="flex flex-col gap-2 px-5 py-5">
            <LinkButton href="/topups" variant="ghost">
              Lịch sử nạp xu
            </LinkButton>
            <Button variant="secondary" onClick={() => void logout()}>
              Đăng xuất
            </Button>
          </div>
        </Panel>
      </div>
    </>
  );
}
