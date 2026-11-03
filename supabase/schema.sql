-- ============================================================================
-- KTU Notes — Supabase schema, RLS and storage setup
-- Run this whole file in the Supabase SQL editor (Dashboard → SQL → New query).
-- Safe to re-run: it uses IF NOT EXISTS / DROP POLICY IF EXISTS.
--
-- Design note: the content tree is one recursive table (`content_nodes`) with a
-- typed node (semester, subject, folder, module, topic, subtopic, note, resource).
-- This supports unlimited nesting without a fixed semester > subject > module
-- hierarchy. Note bodies live in `documents`; binaries live in Storage and are
-- described by `assets`. Every row is owned by auth.uid() and protected by RLS.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- content tree
create table if not exists public.content_nodes (
  user_id       uuid        not null references auth.users (id) on delete cascade,
  id            text        not null,
  parent_id     text,
  type          text        not null check (type in
                  ('semester','subject','folder','module','topic','subtopic','note','resource')),
  title         text        not null,
  code          text,
  description   text,
  source        text        not null default 'personal',
  sort_order    integer     not null default 0,
  pinned        boolean     not null default false,
  unverified    boolean     not null default false,
  semester_no   integer,
  hours         integer,
  category      text,
  progress      text,
  credits       numeric,
  contact_hours text,
  accessed      bigint,
  created       bigint,
  modified      bigint,
  primary key (user_id, id),
  constraint content_nodes_parent_fk
    foreign key (user_id, parent_id)
    references public.content_nodes (user_id, id)
    on delete cascade
    deferrable initially deferred
);

create index if not exists content_nodes_parent_idx on public.content_nodes (user_id, parent_id, sort_order);
create index if not exists content_nodes_type_idx   on public.content_nodes (user_id, type);

-- ---------------------------------------------------------------- note bodies
create table if not exists public.documents (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  node_id    text        not null,
  html       text        not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, node_id),
  constraint documents_node_fk
    foreign key (user_id, node_id)
    references public.content_nodes (user_id, id)
    on delete cascade
    deferrable initially deferred
);

-- ---------------------------------------------------------------- image assets
create table if not exists public.assets (
  user_id  uuid        not null references auth.users (id) on delete cascade,
  id       text        not null,
  node_id  text,
  name     text,
  type     text,
  path     text        not null,
  size     bigint      not null default 0,
  created  timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists assets_node_idx on public.assets (user_id, node_id);

-- ---------------------------------------------------------------- import log
create table if not exists public.import_history (
  id          bigserial primary key,
  user_id     uuid        not null references auth.users (id) on delete cascade,
  imported_at timestamptz not null default now(),
  file_name   text,
  mode        text,
  node_count  integer     not null default 0,
  note_count  integer     not null default 0,
  image_count integer     not null default 0,
  summary     jsonb
);

-- ---------------------------------------------------------------- RLS
alter table public.content_nodes  enable row level security;
alter table public.documents      enable row level security;
alter table public.assets         enable row level security;
alter table public.import_history enable row level security;

drop policy if exists "own content nodes" on public.content_nodes;
create policy "own content nodes" on public.content_nodes
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "own documents" on public.documents;
create policy "own documents" on public.documents
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "own assets" on public.assets;
create policy "own assets" on public.assets
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "own import history" on public.import_history;
create policy "own import history" on public.import_history
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------- grants
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.content_nodes  to authenticated;
grant select, insert, update, delete on public.documents      to authenticated;
grant select, insert, update, delete on public.assets         to authenticated;
grant select, insert, update, delete on public.import_history to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- ---------------------------------------------------------------- storage
insert into storage.buckets (id, name, public)
values ('note-assets', 'note-assets', false)
on conflict (id) do nothing;

drop policy if exists "note assets read"   on storage.objects;
drop policy if exists "note assets write"  on storage.objects;
drop policy if exists "note assets update" on storage.objects;
drop policy if exists "note assets delete" on storage.objects;

create policy "note assets read" on storage.objects
  for select to authenticated
  using (bucket_id = 'note-assets' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "note assets write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'note-assets' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "note assets update" on storage.objects
  for update to authenticated
  using (bucket_id = 'note-assets' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'note-assets' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "note assets delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'note-assets' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================================
-- Optional: keep updated_at fresh on documents
-- ============================================================================
create or replace function public.touch_document()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists documents_touch on public.documents;
create trigger documents_touch
  before update on public.documents
  for each row execute function public.touch_document();
