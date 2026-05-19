-- Cache the AI-generated stylized character sheet per character so we don't
-- regenerate it on every per-panel retry.

alter table public.comic_characters
    add column if not exists character_sheet_path text;
