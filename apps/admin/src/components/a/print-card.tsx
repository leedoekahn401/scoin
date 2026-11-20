import type { PrintableCard } from '@schoolcoin/types';
import { Avatar, CoinMark, formatCardCode } from '@schoolcoin/ui';
import { QRCodeSVG } from 'qrcode.react';

/**
 * A student card at real ID-1 size (85.6 × 54 mm, FR-ADM-02): a gold header
 * band with the brand and school, photo + name on the left, the card-code QR
 * on the right. Print colours are forced so the band survives "no
 * backgrounds" print settings.
 */
export function PrintCard({ card }: { card: PrintableCard }) {
  return (
    <div className="flex h-[54mm] w-[85.6mm] shrink-0 break-inside-avoid flex-col overflow-hidden rounded-[3mm] border border-border-strong bg-surface-white [print-color-adjust:exact]">
      <div className="flex h-[10mm] shrink-0 items-center justify-between bg-brand px-[4mm]">
        <span className="flex items-center gap-[1.5mm]">
          <CoinMark className="size-[5.5mm]" />
          <span className="font-display text-[12px] font-semibold tracking-tight text-ink-fg">
            SchoolCoin
          </span>
        </span>
        <span className="text-[8px] font-semibold text-ink-fg/75">THCS Nguyễn Du</span>
      </div>
      <div className="flex min-h-0 flex-1 items-stretch gap-[3mm] px-[4mm] py-[3mm]">
        <Avatar
          name={card.fullName}
          src={card.photoUrl}
          shape="rounded"
          className="h-[30mm] w-[23mm] shrink-0 rounded-[2mm] text-2xl"
        />
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <p className="text-[7px] text-ink-muted">Thẻ học sinh</p>
            <p className="mt-[0.5mm] font-display text-[13px] font-semibold leading-tight text-ink-fg">
              {card.fullName}
            </p>
            <p className="mt-[1mm] text-[9px] text-ink-fg">Lớp {card.className}</p>
            <p className="font-mono text-[8px] text-ink-muted">{card.studentCode}</p>
          </div>
          <p className="text-[6.5px] leading-snug text-ink-muted">
            Nhặt được thẻ, vui lòng gửi văn phòng nhà trường.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-center justify-center gap-[1mm]">
          <QRCodeSVG value={card.cardCode} size={84} level="M" />
          <span className="font-mono text-[6.5px] tracking-tight text-ink-muted">
            {formatCardCode(card.cardCode)}
          </span>
        </div>
      </div>
    </div>
  );
}
