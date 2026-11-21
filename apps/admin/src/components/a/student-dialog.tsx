'use client';

import { useApi } from '@schoolcoin/api-client/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Student } from '@schoolcoin/types';
import { Button, Field, Input, Modal, errorMessage, toast } from '@schoolcoin/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { queryKeys } from '@/lib/query-keys';

const schema = z.object({
  studentCode: z.string().trim().min(1, 'Nhập mã học sinh').max(30, 'Mã quá dài'),
  fullName: z.string().trim().min(1, 'Nhập họ và tên').max(100, 'Tên quá dài'),
  className: z.string().trim().min(1, 'Nhập lớp').max(20, 'Tên lớp quá dài'),
  photoUrl: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || /^(https?:\/\/|data:image\/)/i.test(value),
      'Nhập đường dẫn ảnh hợp lệ',
    ),
});

type FormValues = z.infer<typeof schema>;

export function StudentDialog({
  student,
  onClose,
}: {
  student: Student | null;
  onClose: () => void;
}) {
  const api = useApi();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      studentCode: student?.studentCode ?? '',
      fullName: student?.fullName ?? '',
      className: student?.className ?? '',
      photoUrl: student?.photoUrl ?? '',
    },
  });

  const save = useMutation({
    mutationFn: (values: FormValues) => {
      const dto = {
        studentCode: values.studentCode,
        fullName: values.fullName,
        className: values.className,
        photoUrl: values.photoUrl || null,
      };
      return student ? api.admin.updateStudent(student.id, dto) : api.admin.createStudent(dto);
    },
    onSuccess: (result) => {
      toast.success(student ? 'Đã lưu thông tin học sinh' : 'Đã thêm học sinh');
      void queryClient.invalidateQueries({ queryKey: queryKeys.studentsAll });
      if (student) void queryClient.invalidateQueries({ queryKey: queryKeys.student(student.id) });
      onClose();
      if (!student) router.push(`/students/${result.id}`);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={student ? 'Sửa thông tin học sinh' : 'Thêm học sinh'}
      size="md"
      closeDisabled={save.isPending}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={save.isPending}>
            Hủy
          </Button>
          <Button
            variant="primary"
            data-primary
            loading={save.isPending}
            onClick={handleSubmit((values) => save.mutate(values))}
          >
            {student ? 'Lưu thông tin' : 'Thêm học sinh'}
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
          name="studentCode"
          render={({ field, fieldState }) => (
            <Field label="Mã học sinh" error={fieldState.error?.message}>
              {(props) => <Input {...props} {...field} maxLength={30} placeholder="VD: 7A001" />}
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
        <Controller
          control={control}
          name="className"
          render={({ field, fieldState }) => (
            <Field label="Lớp" error={fieldState.error?.message}>
              {(props) => <Input {...props} {...field} maxLength={20} placeholder="VD: 7A1" />}
            </Field>
          )}
        />
        <Controller
          control={control}
          name="photoUrl"
          render={({ field, fieldState }) => (
            <Field label="Ảnh" optional error={fieldState.error?.message}>
              {(props) => (
                <Input {...props} {...field} type="url" placeholder="https://… hoặc data:image/…" />
              )}
            </Field>
          )}
        />
      </form>
    </Modal>
  );
}
