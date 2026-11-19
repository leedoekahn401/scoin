import { PrismaClient, type MenuItem } from '@prisma/client';

// B10: 4 categories, 15 items (Cơm gà 30, Bánh mì 15, Sữa đậu nành 8, Nước suối 5 named in the spec).
const MENU: Record<string, [name: string, priceCredits: number][]> = {
  'Món chính': [
    ['Cơm gà', 30],
    ['Cơm sườn', 30],
    ['Bún bò', 30],
    ['Mì xào', 25],
  ],
  'Ăn nhẹ': [
    ['Bánh mì', 15],
    ['Xôi', 12],
    ['Bánh bao', 10],
    ['Khoai tây chiên', 15],
  ],
  'Đồ uống': [
    ['Sữa đậu nành', 8],
    ['Nước suối', 5],
    ['Trà đá', 3],
    ['Nước cam', 15],
  ],
  'Tráng miệng': [
    ['Sữa chua', 7],
    ['Chè', 10],
    ['Trái cây', 10],
  ],
};

export async function seedMenu(prisma: PrismaClient): Promise<MenuItem[]> {
  const items: MenuItem[] = [];
  let sortOrder = 0;
  for (const [categoryName, entries] of Object.entries(MENU)) {
    const category =
      (await prisma.menuCategory.findFirst({ where: { name: categoryName } })) ??
      (await prisma.menuCategory.create({ data: { name: categoryName, sortOrder } }));
    sortOrder++;
    for (const [name, priceCredits] of entries) {
      const existing = await prisma.menuItem.findFirst({
        where: { name, categoryId: category.id },
      });
      items.push(
        existing ??
          (await prisma.menuItem.create({ data: { name, priceCredits, categoryId: category.id } })),
      );
    }
  }
  return items;
}
