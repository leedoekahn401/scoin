'use client';

import { Notice, PageHeader } from '@schoolcoin/ui';

export function ForbiddenNotice({ title, description }: { title: string; description?: string }) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <Notice tone="danger">Bạn không có quyền truy cập trang này.</Notice>
    </>
  );
}
