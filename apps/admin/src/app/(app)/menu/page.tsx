'use client';

import { useApi, useSession } from '@schoolcoin/api-client/react';
import type { MenuCategoryWithItems, MenuItem } from '@schoolcoin/types';
import { Capability, can, vnDate } from '@schoolcoin/types';
import {
  Button,
  EmptyState,
  LoadingBlock,
  Notice,
  PageHeader,
  errorMessage,
  toast,
} from '@schoolcoin/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { ForbiddenNotice } from '@/components/b/forbidden-notice';
import { MenuArchivedSection } from '@/components/b/menu-archived-section';
import { MenuCategoryPanel } from '@/components/b/menu-category-panel';
import { CategoryDialog } from '@/components/b/menu-category-dialog';
import { MenuItemDialog } from '@/components/b/menu-item-dialog';
import { queryKeys } from '@/lib/query-keys';

type ItemPatch = { id: string; available: boolean };
type SoldOutPatch = { id: string; soldOut: boolean };
type ArchivePatch = { id: string; archived: boolean };

function useMenuMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
  successMessage: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(successMessage);
      void queryClient.invalidateQueries({ queryKey: queryKeys.menu });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

export default function MenuPage() {
  const { user } = useSession();
  if (!can(user?.role, Capability.MANAGE_MENU)) {
    return <ForbiddenNotice title="Thực đơn & giá" />;
  }
  return <MenuScreen />;
}

function MenuScreen() {
  const api = useApi();
  const queryClient = useQueryClient();
  const [categoryDialog, setCategoryDialog] = useState<{
    category: MenuCategoryWithItems | null;
  } | null>(null);
  const [itemDialog, setItemDialog] = useState<{ item: MenuItem | null } | null>(null);
  const today = vnDate();

  const menu = useQuery({
    queryKey: queryKeys.menu,
    queryFn: () => api.admin.listMenu(),
  });

  const availability = useMutation({
    mutationFn: ({ id, available }: ItemPatch) => api.admin.updateItem(id, { available }),
    onMutate: async ({ id, available }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.menu });
      const previous = queryClient.getQueryData<MenuCategoryWithItems[]>(queryKeys.menu);
      queryClient.setQueryData<MenuCategoryWithItems[]>(queryKeys.menu, (old) =>
        old?.map((category) => ({
          ...category,
          items: category.items.map((item) => (item.id === id ? { ...item, available } : item)),
        })),
      );
      return { previous };
    },
    onError: (err, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.menu, context.previous);
      toast.error(errorMessage(err));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.menu });
    },
  });

  const soldOut = useMutation({
    mutationFn: ({ id, soldOut }: SoldOutPatch) => api.admin.setSoldOut(id, soldOut),
    onMutate: async ({ id, soldOut: next }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.menu });
      const previous = queryClient.getQueryData<MenuCategoryWithItems[]>(queryKeys.menu);
      queryClient.setQueryData<MenuCategoryWithItems[]>(queryKeys.menu, (old) =>
        old?.map((category) => ({
          ...category,
          items: category.items.map((item) =>
            item.id === id ? { ...item, soldOutDate: next ? today : null } : item,
          ),
        })),
      );
      return { previous };
    },
    onError: (err, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.menu, context.previous);
      toast.error(errorMessage(err));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.menu });
    },
  });

  const archiveCategory = useMenuMutation<ArchivePatch>(
    ({ id, archived }) => api.admin.updateCategory(id, { archived }),
    'Đã cập nhật danh mục',
  );
  const archiveItem = useMenuMutation<ArchivePatch>(
    ({ id, archived }) => api.admin.updateItem(id, { archived }),
    'Đã cập nhật món',
  );

  const categories = menu.data ?? [];
  const activeCategories = categories.filter((category) => !category.archived);
  const archivedCategories = categories.filter((category) => category.archived);
  const archivedItems = categories.flatMap((category) =>
    category.items
      .filter((item) => item.archived)
      .map((item) => ({ item, categoryName: category.name })),
  );

  return (
    <>
      <PageHeader
        title="Thực đơn & giá"
        description="Cập nhật món bán, giá và trạng thái từng món trong ngày."
        actions={
          <>
            <Button variant="secondary" onClick={() => setCategoryDialog({ category: null })}>
              Thêm danh mục
            </Button>
            <Button
              variant="primary"
              onClick={() => setItemDialog({ item: null })}
              disabled={activeCategories.length === 0}
            >
              Thêm món
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-6">
        <Notice tone="info">
          Giá mới chỉ áp dụng cho đơn hàng sau khi lưu. Đơn cũ giữ nguyên giá lúc bán.
        </Notice>

        {menu.isPending ? (
          <LoadingBlock className="min-h-80" />
        ) : menu.error ? (
          <Notice
            tone="danger"
            action={
              <Button size="sm" onClick={() => void menu.refetch()}>
                Thử lại
              </Button>
            }
          >
            {errorMessage(menu.error)}
          </Notice>
        ) : activeCategories.length === 0 ? (
          <EmptyState
            title="Chưa có danh mục nào"
            description="Tạo danh mục đầu tiên để bắt đầu thêm món."
            action={
              <Button variant="secondary" onClick={() => setCategoryDialog({ category: null })}>
                Thêm danh mục
              </Button>
            }
          />
        ) : (
          activeCategories.map((category) => (
            <MenuCategoryPanel
              key={category.id}
              category={category}
              categoryIndex={categories.findIndex((entry) => entry.id === category.id)}
              onRename={() => setCategoryDialog({ category })}
              onArchive={() => archiveCategory.mutate({ id: category.id, archived: true })}
              onAddItem={() => setItemDialog({ item: null })}
              onEditItem={(item) => setItemDialog({ item })}
              onArchiveItem={(id) => archiveItem.mutate({ id, archived: true })}
              onToggleAvailable={(id, available) => availability.mutate({ id, available })}
              onToggleSoldOut={(id, next) => soldOut.mutate({ id, soldOut: next })}
            />
          ))
        )}

        {(archivedCategories.length > 0 || archivedItems.length > 0) && (
          <MenuArchivedSection
            categories={archivedCategories}
            items={archivedItems}
            onRestoreCategory={(id) => archiveCategory.mutate({ id, archived: false })}
            onRestoreItem={(id) => archiveItem.mutate({ id, archived: false })}
          />
        )}
      </div>

      {categoryDialog && (
        <CategoryDialog
          category={categoryDialog.category}
          onClose={() => setCategoryDialog(null)}
        />
      )}
      {itemDialog && (
        <MenuItemDialog
          item={itemDialog.item}
          categories={activeCategories}
          onClose={() => setItemDialog(null)}
        />
      )}
    </>
  );
}
