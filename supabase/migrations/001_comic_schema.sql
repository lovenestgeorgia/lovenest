-- Lovenest comic generator schema
-- Run in Supabase SQL editor or via `supabase db push`.

create extension if not exists pgcrypto;

-- ====================== Tables ======================

create table if not exists public.comic_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'My Comic',
  status text not null default 'draft',
    -- draft | interviewing | characters | styling | generating | preview | paid | fulfilled
  story_text text not null default '',
  style_id text,
  panel_count int not null default 10 check (panel_count between 4 and 16),
  paid_digital boolean not null default false,
  paid_print boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists comic_projects_user_idx on public.comic_projects (user_id, created_at desc);

create table if not exists public.comic_messages (
  id bigserial primary key,
  project_id uuid not null references public.comic_projects(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists comic_messages_project_idx on public.comic_messages (project_id, created_at);

create table if not exists public.comic_characters (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.comic_projects(id) on delete cascade,
  name text not null,
  description text not null default '',
  persona text not null default '', -- AI-generated detailed visual description
  reference_image_url text,
  reference_image_path text,
  created_at timestamptz not null default now()
);
create index if not exists comic_characters_project_idx on public.comic_characters (project_id);

create table if not exists public.comic_panels (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.comic_projects(id) on delete cascade,
  ord int not null,
  scene_prompt text not null,
  caption text not null default '',
  image_url text,
  image_path text,
  status text not null default 'pending' check (status in ('pending', 'generating', 'ready', 'failed')),
  revision_count int not null default 0,
  is_hq boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, ord)
);
create index if not exists comic_panels_project_idx on public.comic_panels (project_id, ord);

create table if not exists public.comic_orders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.comic_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('digital', 'print')),
  amount numeric(10,2) not null,
  payment_method text not null check (payment_method in ('unipay', 'cod')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'cancelled')),
  unipay_order_id text,
  shipping_name text,
  shipping_phone text,
  shipping_city text,
  shipping_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists comic_orders_user_idx on public.comic_orders (user_id, created_at desc);

-- ====================== updated_at trigger ======================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists comic_projects_updated_at on public.comic_projects;
create trigger comic_projects_updated_at before update on public.comic_projects
  for each row execute function public.set_updated_at();

drop trigger if exists comic_panels_updated_at on public.comic_panels;
create trigger comic_panels_updated_at before update on public.comic_panels
  for each row execute function public.set_updated_at();

drop trigger if exists comic_orders_updated_at on public.comic_orders;
create trigger comic_orders_updated_at before update on public.comic_orders
  for each row execute function public.set_updated_at();

-- ====================== Row-Level Security ======================

alter table public.comic_projects enable row level security;
alter table public.comic_messages enable row level security;
alter table public.comic_characters enable row level security;
alter table public.comic_panels enable row level security;
alter table public.comic_orders enable row level security;

-- comic_projects: user owns
drop policy if exists "projects_select_own" on public.comic_projects;
create policy "projects_select_own" on public.comic_projects for select using (auth.uid() = user_id);
drop policy if exists "projects_insert_own" on public.comic_projects;
create policy "projects_insert_own" on public.comic_projects for insert with check (auth.uid() = user_id);
drop policy if exists "projects_update_own" on public.comic_projects;
create policy "projects_update_own" on public.comic_projects for update using (auth.uid() = user_id);
drop policy if exists "projects_delete_own" on public.comic_projects;
create policy "projects_delete_own" on public.comic_projects for delete using (auth.uid() = user_id);

-- helper macro pattern for "owns the project"
-- comic_messages
drop policy if exists "messages_select_owner" on public.comic_messages;
create policy "messages_select_owner" on public.comic_messages for select
  using (exists (select 1 from public.comic_projects p where p.id = project_id and p.user_id = auth.uid()));
drop policy if exists "messages_insert_owner" on public.comic_messages;
create policy "messages_insert_owner" on public.comic_messages for insert
  with check (exists (select 1 from public.comic_projects p where p.id = project_id and p.user_id = auth.uid()));

-- comic_characters
drop policy if exists "characters_select_owner" on public.comic_characters;
create policy "characters_select_owner" on public.comic_characters for select
  using (exists (select 1 from public.comic_projects p where p.id = project_id and p.user_id = auth.uid()));
drop policy if exists "characters_insert_owner" on public.comic_characters;
create policy "characters_insert_owner" on public.comic_characters for insert
  with check (exists (select 1 from public.comic_projects p where p.id = project_id and p.user_id = auth.uid()));
drop policy if exists "characters_update_owner" on public.comic_characters;
create policy "characters_update_owner" on public.comic_characters for update
  using (exists (select 1 from public.comic_projects p where p.id = project_id and p.user_id = auth.uid()));
drop policy if exists "characters_delete_owner" on public.comic_characters;
create policy "characters_delete_owner" on public.comic_characters for delete
  using (exists (select 1 from public.comic_projects p where p.id = project_id and p.user_id = auth.uid()));

-- comic_panels (server writes via service role; users only read their own)
drop policy if exists "panels_select_owner" on public.comic_panels;
create policy "panels_select_owner" on public.comic_panels for select
  using (exists (select 1 from public.comic_projects p where p.id = project_id and p.user_id = auth.uid()));
drop policy if exists "panels_update_owner" on public.comic_panels;
create policy "panels_update_owner" on public.comic_panels for update
  using (exists (select 1 from public.comic_projects p where p.id = project_id and p.user_id = auth.uid()));

-- comic_orders (server-managed; users read their own)
drop policy if exists "orders_select_owner" on public.comic_orders;
create policy "orders_select_owner" on public.comic_orders for select using (auth.uid() = user_id);

-- ====================== Storage buckets ======================

insert into storage.buckets (id, name, public)
  values ('comic-characters', 'comic-characters', false)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('comic-panels', 'comic-panels', false)
  on conflict (id) do nothing;

-- Storage policies: files are stored as <user_id>/<project_id>/<filename>
drop policy if exists "characters_read_own" on storage.objects;
create policy "characters_read_own" on storage.objects for select
  using (bucket_id = 'comic-characters' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "characters_write_own" on storage.objects;
create policy "characters_write_own" on storage.objects for insert
  with check (bucket_id = 'comic-characters' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "characters_delete_own" on storage.objects;
create policy "characters_delete_own" on storage.objects for delete
  using (bucket_id = 'comic-characters' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "panels_read_own" on storage.objects;
create policy "panels_read_own" on storage.objects for select
  using (bucket_id = 'comic-panels' and (storage.foldername(name))[1] = auth.uid()::text);
-- panel writes are server-side via the service role; no client write policy
