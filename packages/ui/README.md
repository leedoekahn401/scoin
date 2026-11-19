# @schoolcoin/ui

Shared React components (shadcn/ui on Tailwind) used by all four apps. Owner: FE-1.

Add a shadcn component by copying it into `src/components/` (or run
`pnpm dlx shadcn@2.3.0 add <name>` from this folder and fix the imports to `../lib/utils`),
then export it from `src/index.ts`.

Theme tokens live in `packages/config/tailwind.preset.mjs`.
Money is always shown with `<Credits value={n} />` (NFR-USE-01).
