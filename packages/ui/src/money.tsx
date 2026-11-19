import { CREDIT_VND } from '@schoolcoin/types';

const vnd = new Intl.NumberFormat('vi-VN');

/** <Credits value={25} /> renders "25 credits (25.000₫)". */
export function Credits({ value }: { value: number }) {
  return (
    <span>
      {value} credits ({vnd.format(value * CREDIT_VND)}₫)
    </span>
  );
}
