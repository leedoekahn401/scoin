/** Temporary page body until the screen is built (B8). */
export function Placeholder({ title, note }: { title: string; note?: string }) {
  return (
    <section className="p-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {note && <p className="mt-2 text-muted-foreground">{note}</p>}
    </section>
  );
}
