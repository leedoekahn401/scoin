import { CREDIT_VND } from '@schoolcoin/types';

const vnd = new Intl.NumberFormat('vi-VN');

export function formatVnd(credits: number): string {
  return `${vnd.format(credits * CREDIT_VND)}₫`;
}

/** NFR-USE-01: <Credits value={25} /> renders "25 credit (25.000₫)". */
export function Credits({ value, className }: { value: number; className?: string }) {
  return (
    <span className={className}>
      {vnd.format(value)} credit <span className="text-muted-foreground">({formatVnd(value)})</span>
    </span>
  );
}
