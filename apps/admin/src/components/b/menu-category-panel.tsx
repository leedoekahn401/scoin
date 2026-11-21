'use client';

import type { MenuCategoryWithItems, MenuItem } from '@schoolcoin/types';
import { vnDate } from '@schoolcoin/types';
import {
  Button,
  EmptyState,
  Panel,
  PanelHeader,
  Switch,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
  formatCredits,
  pastelAt,
  pastelStyle,
} from '@schoolcoin/ui';

export function MenuCategoryPanel({
  category,
  categoryIndex,
  onRename,
  onArchive,
  onAddItem,
  onEditItem,
  onArchiveItem,
  onToggleAvailable,
  onToggleSoldOut,
}: {
  category: MenuCategoryWithItems;
  categoryIndex: number;
  onRename: () => void;
  onArchive: () => void;
  onAddItem: () => void;
  onEditItem: (item: MenuItem) => void;
  onArchiveItem: (id: string) => void;
  onToggleAvailable: (id: string, available: boolean) => void;
  onToggleSoldOut: (id: string, soldOut: boolean) => void;
}) {
  const today = vnDate();
  const items = category.items.filter((item) => !item.archived);

  return (
    <Panel>
      <PanelHeader
        title={category.name}
        description={<span className="tabular">{items.length} món</span>}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={onRename}>
              Sửa tên
            </Button>
            <Button variant="ghost" size="sm" onClick={onArchive}>
              Lưu trữ
            </Button>
          </>
        }
      />
      {items.length === 0 ? (
        <EmptyState
          title="Danh mục này chưa có món"
          action={
            <Button variant="secondary" size="sm" onClick={onAddItem}>
              Thêm món
            </Button>
          }
        />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Món</TH>
              <TH align="right">Giá</TH>
              <TH>Đang bán</TH>
              <TH>Hết hôm nay</TH>
              <TH align="right">Thao tác</TH>
            </tr>
          </THead>
          <TBody>
            {items.map((item) => (
              <TR key={item.id}>
                <TD>
                  <span className="inline-flex items-center gap-2.5">
                    <span
                      aria-hidden
                      className="pastel-tinted size-2.5 rounded-full"
                      style={pastelStyle(pastelAt(categoryIndex))}
                    />
                    <span className="font-medium">{item.name}</span>
                  </span>
                </TD>
                <TD align="right">{formatCredits(item.priceCredits)}</TD>
                <TD>
                  <Switch
                    checked={item.available}
                    onChange={(next) => onToggleAvailable(item.id, next)}
                    label={`Đang bán ${item.name}`}
                  />
                </TD>
                <TD>
                  <Switch
                    checked={item.soldOutDate === today}
                    onChange={(next) => onToggleSoldOut(item.id, next)}
                    label={`Hết hôm nay ${item.name}`}
                  />
                </TD>
                <TD align="right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onEditItem(item)}>
                      Sửa
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onArchiveItem(item.id)}>
                      Lưu trữ
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </Panel>
  );
}
