'use client';

import type { MenuCategoryWithItems, MenuItem } from '@schoolcoin/types';
import { Button, Panel, PanelHeader } from '@schoolcoin/ui';
import { useState } from 'react';

export function MenuArchivedSection({
  categories,
  items,
  onRestoreCategory,
  onRestoreItem,
}: {
  categories: MenuCategoryWithItems[];
  items: { item: MenuItem; categoryName: string }[];
  onRestoreCategory: (id: string) => void;
  onRestoreItem: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Panel>
      <PanelHeader
        title="Đã lưu trữ"
        description={
          <span className="tabular">
            {categories.length} danh mục · {items.length} món
          </span>
        }
        actions={
          <Button variant="ghost" size="sm" onClick={() => setOpen(!open)}>
            {open ? 'Ẩn' : 'Hiện'}
          </Button>
        }
      />
      {open && (
        <div className="divide-y divide-border px-5 py-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center gap-3 py-2.5 text-sm">
              <span className="min-w-0 flex-1 truncate font-medium text-ink-fg">
                {category.name}
              </span>
              <span className="text-xs text-ink-muted">Danh mục</span>
              <Button variant="secondary" size="sm" onClick={() => onRestoreCategory(category.id)}>
                Khôi phục
              </Button>
            </div>
          ))}
          {items.map(({ item, categoryName }) => (
            <div key={item.id} className="flex items-center gap-3 py-2.5 text-sm">
              <span className="min-w-0 flex-1 truncate font-medium text-ink-fg">{item.name}</span>
              <span className="truncate text-xs text-ink-muted">{categoryName}</span>
              <Button variant="secondary" size="sm" onClick={() => onRestoreItem(item.id)}>
                Khôi phục
              </Button>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
