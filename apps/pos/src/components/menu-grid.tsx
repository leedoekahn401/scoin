'use client';

import type { MenuCategoryWithItems, MenuItem } from '@schoolcoin/types';
import { PillToggle, cn, formatCredits, pastelAt, pastelStyle } from '@schoolcoin/ui';
import { useMemo, useState } from 'react';

interface MenuGridProps {
  categories: MenuCategoryWithItems[];
  quantityByItem: Record<string, number>;
  onAdd: (item: Pick<MenuItem, 'id' | 'name' | 'priceCredits'>) => void;
}

export function MenuGrid({ categories, quantityByItem, onAdd }: MenuGridProps) {
  const [selected, setSelected] = useState('all');

  const options = useMemo(
    () => [
      { value: 'all', label: 'Tất cả' },
      ...categories.map((category) => ({ value: category.id, label: category.name })),
    ],
    [categories],
  );

  const items = useMemo(() => {
    if (selected === 'all') {
      return categories.flatMap((category, categoryIndex) =>
        category.items.map((item) => ({ item, categoryIndex })),
      );
    }
    const categoryIndex = categories.findIndex((category) => category.id === selected);
    const category = categoryIndex >= 0 ? categories[categoryIndex] : undefined;
    if (!category) return [];
    return category.items.map((item) => ({ item, categoryIndex }));
  }, [categories, selected]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border bg-surface-white px-4 py-3">
        <PillToggle
          size="lg"
          ariaLabel="Danh mục món"
          layoutIdPrefix="pos-menu"
          options={options}
          value={selected}
          onChange={setSelected}
          className="w-full"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-3 gap-3 xl:grid-cols-4">
          {items.map(({ item, categoryIndex }) => {
            const qty = quantityByItem[item.id] ?? 0;
            const inCart = qty > 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  onAdd({ id: item.id, name: item.name, priceCredits: item.priceCredits })
                }
                className={cn(
                  'workbook-panel workbook-press relative flex min-h-[6.5rem] flex-col justify-between p-3 text-left',
                  inCart && 'border-brand bg-brand-tint',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="line-clamp-2 font-semibold text-ink-fg">{item.name}</span>
                  {inCart && (
                    <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold tabular text-ink-fg">
                      {qty}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-end justify-between gap-2">
                  <span
                    className="pastel-tinted inline-flex size-2.5 shrink-0 rounded-full border border-border"
                    style={pastelStyle(pastelAt(categoryIndex))}
                    aria-hidden
                  />
                  <span className="text-sm font-semibold tabular text-ink-fg">
                    {formatCredits(item.priceCredits)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
