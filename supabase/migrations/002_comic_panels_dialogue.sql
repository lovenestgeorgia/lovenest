-- Adds dialogue / multi-action / page-type support to comic panels and project subtitle.
-- Idempotent: safe to run multiple times.

alter table public.comic_projects
    add column if not exists subtitle text not null default '';

alter table public.comic_panels
    add column if not exists dialogue jsonb not null default '[]'::jsonb,
    add column if not exists actions jsonb not null default '[]'::jsonb,
    add column if not exists page_type text not null default 'story';

-- Replace the existing check constraint on status to keep room for new types
do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conname = 'comic_panels_page_type_check'
    ) then
        alter table public.comic_panels
            add constraint comic_panels_page_type_check
            check (page_type in ('cover', 'story', 'closing'));
    end if;
end$$;
