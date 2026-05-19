-- Stores the AI critic's review of each generated panel (text spelling check,
-- visual issues, score, suggestions). JSONB so the schema can evolve freely.

alter table public.comic_panels
    add column if not exists critique jsonb;
