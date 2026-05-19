-- Promocodes for the comic bundle checkout.
--
-- `code` is stored uppercase so case-insensitive matching is a plain equality
-- (clients are expected to UPPER() before insert and the API helper does the
-- same on lookup).
--
-- `discount_type` is either 'percent' (0-100 → percentage off the base price)
-- or 'fixed' (a flat GEL amount off). Both are capped to the base price so a
-- 100% code or a flat amount > price produces a free order, never negative.
--
-- max_uses NULL = unlimited. uses is incremented atomically inside the
-- checkout transaction so two concurrent customers can't both pass a
-- max_uses=1 check.
create table if not exists comic_promocodes (
    id uuid primary key default gen_random_uuid(),
    code text not null unique,
    discount_type text not null check (discount_type in ('percent', 'fixed')),
    discount_value numeric not null check (discount_value >= 0),
    max_uses int,
    uses int not null default 0,
    starts_at timestamptz,
    expires_at timestamptz,
    active boolean not null default true,
    description text,
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now()
);

create index if not exists comic_promocodes_code_idx on comic_promocodes (code);

-- Record which code (if any) was used on each order, and how much it shaved
-- off. Useful for refund reasoning and admin analytics.
alter table comic_orders
    add column if not exists promocode text,
    add column if not exists discount_amount numeric;

-- RLS off — promocodes are only ever touched by the service-role admin
-- client in API routes. Lock it down so end users can't enumerate the table
-- from the browser.
alter table comic_promocodes enable row level security;
