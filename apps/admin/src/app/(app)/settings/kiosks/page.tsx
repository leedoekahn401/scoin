'use client';

import { useApi } from '@schoolcoin/api-client/react';
import type { CreateKioskDeviceResult } from '@schoolcoin/types';
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  LoadingBlock,
  Modal,
  Notice,
  PageHeader,
  Panel,
  PanelHeader,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  errorMessage,
  formatDate,
  formatRelative,
  toast,
} from '@schoolcoin/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { CopyButton } from '@/components/a/copy-button';
import { queryKeys } from '@/lib/query-keys';

export default function KiosksPage() {
  const api = useApi();
  const queryClient = useQueryClient();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [name, setName] = useState('');
  const [created, setCreated] = useState<CreateKioskDeviceResult | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const devices = useQuery({
    queryKey: queryKeys.kiosks,
    queryFn: () => api.admin.listKioskDevices(),
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.kiosks });
    void queryClient.invalidateQueries({ queryKey: queryKeys.audit({}) });
  };

  const create = useMutation({
    mutationFn: (deviceName: string) => api.admin.createKioskDevice({ name: deviceName }),
    onSuccess: (result) => {
      setCreated(result);
      setRegisterOpen(false);
      setName('');
      refresh();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => api.admin.revokeKioskDevice(id),
    onSuccess: () => {
      toast.success('Đã thu hồi thiết bị');
      setRevokeId(null);
      refresh();
    },
    onError: (err) => {
      toast.error(errorMessage(err));
      setRevokeId(null);
    },
  });

  return (
    <>
      <PageHeader
        title="Thiết bị kiosk"
        description="Đăng ký và thu hồi các thiết bị đặt tại căng tin."
        actions={
          <Button variant="primary" onClick={() => setRegisterOpen(true)}>
            Đăng ký kiosk
          </Button>
        }
      />

      <Panel>
        <PanelHeader title="Danh sách thiết bị" />
        {devices.isPending ? (
          <LoadingBlock />
        ) : devices.error ? (
          <div className="px-5 py-5">
            <Notice
              tone="danger"
              action={
                <Button size="sm" onClick={() => void devices.refetch()}>
                  Thử lại
                </Button>
              }
            >
              {errorMessage(devices.error)}
            </Notice>
          </div>
        ) : devices.data.length === 0 ? (
          <EmptyState title="Chưa có thiết bị" description="Đăng ký kiosk để bắt đầu." />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Tên thiết bị</TH>
                <TH>Trạng thái</TH>
                <TH>Lần cuối kết nối</TH>
                <TH>Ngày đăng ký</TH>
                <TH align="right">Thao tác</TH>
              </tr>
            </THead>
            <TBody>
              {devices.data.map((device) => (
                <TR key={device.id}>
                  <TD>
                    <span className="font-medium">{device.name}</span>
                    <span className="mt-0.5 block font-mono text-xs text-ink-muted">
                      {device.id}
                    </span>
                  </TD>
                  <TD>
                    <Badge tone={device.active ? 'success' : 'neutral'}>
                      {device.active ? 'Đang hoạt động' : 'Đã thu hồi'}
                    </Badge>
                  </TD>
                  <TD muted>
                    {device.lastSeenAt ? formatRelative(device.lastSeenAt) : 'Chưa kết nối'}
                  </TD>
                  <TD muted className="tabular">
                    {formatDate(device.createdAt)}
                  </TD>
                  <TD align="right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!device.active}
                      onClick={() => setRevokeId(device.id)}
                    >
                      Thu hồi
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Panel>

      <Modal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        title="Đăng ký kiosk"
        size="sm"
        closeDisabled={create.isPending}
        footer={
          <>
            <Button
              variant="ghost"
              disabled={create.isPending}
              onClick={() => setRegisterOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              loading={create.isPending}
              disabled={name.trim() === ''}
              onClick={() => create.mutate(name.trim())}
            >
              Đăng ký
            </Button>
          </>
        }
      >
        <Field label="Tên thiết bị" hint="Ví dụ: Kiosk căng tin tầng 1">
          {(props) => (
            <Input
              {...props}
              value={name}
              maxLength={60}
              placeholder="Nhập tên thiết bị"
              onChange={(event) => setName(event.target.value)}
            />
          )}
        </Field>
      </Modal>

      <Modal
        open={created !== null}
        onClose={() => setCreated(null)}
        title="Thiết bị đã đăng ký"
        size="sm"
        footer={
          <Button variant="primary" onClick={() => setCreated(null)}>
            Đã lưu khóa
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Khóa thiết bị">
            {() => (
              <div className="flex items-center justify-between gap-3 rounded-[var(--ui-radius)] border border-border bg-paper-bg px-4 py-3">
                <span className="min-w-0 break-all font-mono text-sm text-ink-fg">
                  {created?.deviceKey}
                </span>
                {created && <CopyButton value={created.deviceKey} label="Sao chép khóa thiết bị" />}
              </div>
            )}
          </Field>
          <Notice tone="warning">
            Khóa này chỉ hiển thị một lần. Nhập vào cấu hình kiosk (NEXT_PUBLIC_KIOSK_DEVICE_KEY).
          </Notice>
        </div>
      </Modal>

      <ConfirmDialog
        open={revokeId !== null}
        onClose={() => setRevokeId(null)}
        onConfirm={() => {
          if (revokeId) revoke.mutate(revokeId);
        }}
        title="Thu hồi thiết bị"
        description="Thiết bị sẽ không thể kết nối đến SchoolCoin sau khi bị thu hồi."
        confirmLabel="Thu hồi"
        destructive
        loading={revoke.isPending}
      />
    </>
  );
}
