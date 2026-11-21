'use client';

import { useApi } from '@schoolcoin/api-client/react';
import type { Role, UserProfile } from '@schoolcoin/types';
import {
  ROLE_LABEL,
  USER_STATUS,
  Button,
  Field,
  Input,
  Modal,
  Select,
  errorMessage,
  toast,
} from '@schoolcoin/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { queryKeys } from '@/lib/query-keys';

const BASE_SCHEMA = z.object({
  role: z.enum(['ADMIN', 'ACCOUNTANT', 'CAFE_MANAGER', 'CASHIER']),
  fullName: z.string().trim().min(1, 'Nhập họ và tên').max(100, 'Tên quá dài'),
  email: z.string().trim(),
  username: z.string().trim(),
  phone: z.string().trim(),
  password: z.string(),
});

type FormValues = z.infer<typeof BASE_SCHEMA>;
type StaffRole = Exclude<Role, 'PARENT'>;

function randomPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}

export function StaffDialog({
  user,
  roles,
  canChangeRole,
  onClose,
}: {
  user: UserProfile | null;
  roles: StaffRole[];
  canChangeRole: boolean;
  onClose: () => void;
}) {
  const api = useApi();
  const queryClient = useQueryClient();
  const isEdit = user !== null;
  const schema = BASE_SCHEMA.superRefine((values, ctx) => {
    if (values.password && values.password.length < 8) {
      ctx.addIssue({ code: 'custom', path: ['password'], message: 'Mật khẩu tối thiểu 8 ký tự' });
    }
    if (isEdit) return;
    if (values.role === 'CASHIER') {
      if (!values.username) {
        ctx.addIssue({ code: 'custom', path: ['username'], message: 'Nhập tên đăng nhập' });
      }
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      ctx.addIssue({ code: 'custom', path: ['email'], message: 'Nhập email hợp lệ' });
    }
    if (values.password.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['password'], message: 'Nhập mật khẩu tạm' });
    }
  });

  const { control, handleSubmit, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: roles[0] ?? 'CASHIER',
      fullName: user?.fullName ?? '',
      email: user?.email ?? '',
      username: user?.username ?? '',
      phone: user?.phone ?? '',
      password: '',
    },
  });

  const invalidateUsers = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.usersAll });
    void queryClient.invalidateQueries({ queryKey: queryKeys.audit({}) });
  };

  const save = useMutation({
    mutationFn: (values: FormValues) => {
      if (!isEdit) {
        return api.admin.createUser({
          role: values.role,
          fullName: values.fullName,
          phone: values.phone || undefined,
          ...(values.role === 'CASHIER' ? { username: values.username } : { email: values.email }),
          password: values.password,
        });
      }
      return api.admin.updateUser(user.id, {
        fullName: values.fullName,
        phone: values.phone,
        ...(canChangeRole ? { role: values.role } : {}),
        ...(values.password ? { password: values.password } : {}),
      });
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Đã lưu nhân viên' : 'Đã thêm nhân viên');
      invalidateUsers();
      onClose();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const changeStatus = useMutation({
    mutationFn: (status: 'ACTIVE' | 'DEACTIVATED') =>
      api.admin.updateUser(user?.id ?? '', { status }),
    onSuccess: (updated) => {
      toast.success(updated.status === 'DEACTIVATED' ? 'Đã ngừng hoạt động' : 'Đã kích hoạt lại');
      invalidateUsers();
      onClose();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Sửa nhân viên' : 'Thêm nhân viên'}
      size="md"
      closeDisabled={save.isPending || changeStatus.isPending}
      footer={
        <>
          {user && (
            <div className="mr-auto">
              <Button
                variant={user.status === 'ACTIVE' ? 'danger' : 'secondary'}
                loading={changeStatus.isPending}
                disabled={save.isPending}
                onClick={() =>
                  changeStatus.mutate(user.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE')
                }
              >
                {user.status === 'ACTIVE' ? 'Ngừng hoạt động' : 'Kích hoạt lại'}
              </Button>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={save.isPending || changeStatus.isPending}
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            data-primary
            loading={save.isPending}
            disabled={changeStatus.isPending}
            onClick={handleSubmit((values) => save.mutate(values))}
          >
            {isEdit ? 'Lưu nhân viên' : 'Thêm nhân viên'}
          </Button>
        </>
      }
    >
      <form
        onSubmit={handleSubmit((values) => save.mutate(values))}
        className="flex flex-col gap-4"
      >
        <Controller
          control={control}
          name="role"
          render={({ field, fieldState }) => (
            <Field label="Vai trò" error={fieldState.error?.message}>
              {(props) => (
                <Select {...props} {...field} disabled={isEdit && !canChangeRole}>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABEL[role]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          )}
        />
        <Controller
          control={control}
          name="fullName"
          render={({ field, fieldState }) => (
            <Field label="Họ và tên" error={fieldState.error?.message}>
              {(props) => <Input {...props} {...field} maxLength={100} />}
            </Field>
          )}
        />
        {!isEdit && (
          <>
            {roles.includes('CASHIER') && (
              <Controller
                control={control}
                name="username"
                render={({ field, fieldState }) => (
                  <Field label="Tên đăng nhập" error={fieldState.error?.message}>
                    {(props) => (
                      <Input {...props} {...field} autoComplete="off" placeholder="VD: thungan3" />
                    )}
                  </Field>
                )}
              />
            )}
            {roles.some((role) => role !== 'CASHIER') && (
              <Controller
                control={control}
                name="email"
                render={({ field, fieldState }) => (
                  <Field label="Email" error={fieldState.error?.message}>
                    {(props) => <Input {...props} {...field} type="email" autoComplete="off" />}
                  </Field>
                )}
              />
            )}
          </>
        )}
        <Controller
          control={control}
          name="phone"
          render={({ field, fieldState }) => (
            <Field label="Điện thoại" optional error={fieldState.error?.message}>
              {(props) => <Input {...props} {...field} type="tel" />}
            </Field>
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <Field
              label={isEdit ? 'Đặt lại mật khẩu' : 'Mật khẩu tạm'}
              optional={isEdit}
              error={fieldState.error?.message}
              hint={isEdit ? 'Để trống nếu không đổi mật khẩu' : 'Tối thiểu 8 ký tự'}
            >
              {(props) => (
                <div className="flex items-center gap-2">
                  <Input
                    {...props}
                    {...field}
                    type="text"
                    autoComplete="new-password"
                    className="font-mono"
                  />
                  <Button variant="ghost" onClick={() => setValue('password', randomPassword())}>
                    Tạo ngẫu nhiên
                  </Button>
                </div>
              )}
            </Field>
          )}
        />
        {user && (
          <p className="text-xs text-ink-muted">
            Trạng thái hiện tại: {USER_STATUS[user.status].label}
          </p>
        )}
      </form>
    </Modal>
  );
}
