-- Lock per-character wardrobe and per-panel location for visual consistency.

alter table public.comic_characters
    add column if not exists wardrobe text not null default '';

alter table public.comic_panels
    add column if not exists location text not null default '';
