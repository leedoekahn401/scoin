'use client';

import { useMemo, useReducer } from 'react';

export interface CartLine {
  menuItemId: string;
  name: string;
  unitPriceCredits: number;
  quantity: number;
}

type CartAction =
  | { type: 'add'; item: { menuItemId: string; name: string; unitPriceCredits: number } }
  | { type: 'remove'; menuItemId: string }
  | { type: 'setQty'; menuItemId: string; quantity: number }
  | { type: 'clear' };

function reducer(state: CartLine[], action: CartAction): CartLine[] {
  switch (action.type) {
    case 'add': {
      const existing = state.find((line) => line.menuItemId === action.item.menuItemId);
      if (existing) {
        return state.map((line) =>
          line.menuItemId === action.item.menuItemId
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }
      return [...state, { ...action.item, quantity: 1 }];
    }
    case 'remove':
      return state.filter((line) => line.menuItemId !== action.menuItemId);
    case 'setQty': {
      if (action.quantity <= 0) {
        return state.filter((line) => line.menuItemId !== action.menuItemId);
      }
      return state.map((line) =>
        line.menuItemId === action.menuItemId ? { ...line, quantity: action.quantity } : line,
      );
    }
    case 'clear':
      return [];
    default:
      return state;
  }
}

export function useCart() {
  const [lines, dispatch] = useReducer(reducer, []);

  const totalCredits = useMemo(
    () => lines.reduce((sum, line) => sum + line.unitPriceCredits * line.quantity, 0),
    [lines],
  );

  const quantityByItem = useMemo(() => {
    const map: Record<string, number> = {};
    for (const line of lines) map[line.menuItemId] = line.quantity;
    return map;
  }, [lines]);

  return {
    lines,
    totalCredits,
    quantityByItem,
    add: (item: { menuItemId: string; name: string; unitPriceCredits: number }) =>
      dispatch({ type: 'add', item }),
    remove: (menuItemId: string) => dispatch({ type: 'remove', menuItemId }),
    setQty: (menuItemId: string, quantity: number) =>
      dispatch({ type: 'setQty', menuItemId, quantity }),
    clear: () => dispatch({ type: 'clear' }),
  };
}
