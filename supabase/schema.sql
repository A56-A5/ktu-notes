-- ============================================================================
-- KTU Notes - Supabase schema for a SHARED, LOGIN-FREE notebook
-- Run this whole file in the Supabase SQL editor (Dashboard → SQL → New query).
-- Safe to re-run: IF NOT EXISTS everywhere, DROP POLICY IF EXISTS before create.
--
-- Design: one recursive typed tree (`content_nodes`) with a typed node
-- (semester, subject, folder, module, topic, subtopic, note, resource).
-- Note bodies live in `documents`, binaries live in Storage and are described
-- by `assets`. There is NO authentication: every row belongs to one shared
-- workspace id (default 'public') and anon + authenticated may read and write.
-- Treat the project URL as a public link - anyone who has it can edit.
--
-- Upgrading a project that used the old login-based schema? This file migrates
-- it in place: `user_id` is renamed to `workspace_id`, the auth.users foreign
-- keys are dropped, every row joins the shared 'public' workspace, and the
-- per-user RLS policies become shared ones. Your notes are kept.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- content tree
create table if not exists public.content_nodes (
  workspace_id  text        not null default 'public',
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
  primary key (workspace_id, id),
  constraint content_nodes_parent_fk
    foreign key (workspace_id, parent_id)
    references public.content_nodes (workspace_id, id)
    on delete cascade
    deferrable initially deferred
);

-- ---------------------------------------------------------------- note bodies
create table if not exists public.documents (
  workspace_id text        not null default 'public',
  node_id      text        not null,
  html         text        not null default '',
  updated_at   timestamptz not null default now(),
  primary key (workspace_id, node_id),
  constraint documents_node_fk
    foreign key (workspace_id, node_id)
    references public.content_nodes (workspace_id, id)
    on delete cascade
    deferrable initially deferred
);

-- ---------------------------------------------------------------- image assets
create table if not exists public.assets (
  workspace_id text        not null default 'public',
  id           text        not null,
  node_id      text,
  name         text,
  type         text,
  path         text        not null,
  size         bigint      not null default 0,
  created      timestamptz not null default now(),
  primary key (workspace_id, id)
);

-- ---------------------------------------------------------------- import log
create table if not exists public.import_history (
  id           bigserial primary key,
  workspace_id text        not null default 'public',
  imported_at  timestamptz not null default now(),
  file_name    text,
  mode         text,
  node_count   integer     not null default 0,
  note_count   integer     not null default 0,
  image_count  integer     not null default 0,
  summary      jsonb
);

-- ============================================================================
-- Legacy upgrade: old rows were owned by auth.users via a `user_id` uuid.
-- Rename that column, retype it, and pull every row into the shared workspace.
-- ============================================================================
do $$
declare
  t text;
  c record;
begin
  -- 0. Drop existing policies first: a policy expression depends on its column,
  --    which would block the uuid -> text type change below. The shared policies
  --    are created again at the end of this file.
  for c in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('content_nodes', 'documents', 'assets', 'import_history')
  loop
    execute format('drop policy if exists %I on public.%I', c.policyname, c.tablename);
  end loop;

  -- 1. Drop foreign keys that point at auth.users (they no longer apply).
  if to_regclass('auth.users') is not null then
    for c in
      select conrelid::regclass as tbl, conname
      from pg_constraint
      where contype = 'f'
        and confrelid = to_regclass('auth.users')
        and conrelid in (
          to_regclass('public.content_nodes'),
          to_regclass('public.documents'),
          to_regclass('public.assets'),
          to_regclass('public.import_history')
        )
    loop
      execute format('alter table %s drop constraint %I', c.tbl, c.conname);
    end loop;
  end if;

  -- 2. Drop the tree FKs while the column types change; re-added below.
  if to_regclass('public.documents') is not null then
    alter table public.documents drop constraint if exists documents_node_fk;
  end if;
  if to_regclass('public.content_nodes') is not null then
    alter table public.content_nodes drop constraint if exists content_nodes_parent_fk;
  end if;

  -- 3. Rename user_id -> workspace_id where the old column exists.
  foreach t in array array['content_nodes', 'documents', 'assets', 'import_history'] loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name = 'user_id'
    ) and not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name = 'workspace_id'
    ) then
      execute format('alter table public.%I rename column user_id to workspace_id', t);
    end if;
  end loop;

  -- 4. Colliding node ids from different old users would break the shared
  --    primary key. Refuse with a readable message instead of half-migrating.
  if exists (
    select 1 from public.content_nodes
    group by id having count(distinct workspace_id) > 1
  ) then
    raise exception 'Shared notebook collision: two old users own the same node id. Delete the duplicate rows, then re-run.';
  end if;

  -- 5. uuid -> text, then everything joins the 'public' workspace.
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'content_nodes'
      and column_name = 'workspace_id' and data_type = 'uuid'
  ) then
    foreach t in array array['content_nodes', 'documents', 'assets', 'import_history'] loop
      execute format('alter table public.%I alter column workspace_id drop default', t);
      execute format($f$alter table public.%I alter column workspace_id type text using 'public'$f$, t);
    end loop;
  end if;

  -- 6. Normalise defaults / nullability on every table.
  foreach t in array array['content_nodes', 'documents', 'assets', 'import_history'] loop
    execute format($f$update public.%I set workspace_id = 'public' where workspace_id is null$f$, t);
    execute format($f$alter table public.%I alter column workspace_id set default 'public'$f$, t);
    execute format($f$alter table public.%I alter column workspace_id set not null$f$, t);
  end loop;

  -- 7. Ensure the shared primary keys exist (fresh tables already have them).
  if not exists (
    select 1 from pg_constraint
    where conrelid = to_regclass('public.content_nodes') and contype = 'p'
      and conname = 'content_nodes_pkey'
  ) then
    alter table public.content_nodes add constraint content_nodes_pkey primary key (workspace_id, id);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = to_regclass('public.documents') and contype = 'p'
      and conname = 'documents_pkey'
  ) then
    alter table public.documents add constraint documents_pkey primary key (workspace_id, node_id);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = to_regclass('public.assets') and contype = 'p'
      and conname = 'assets_pkey'
  ) then
    alter table public.assets add constraint assets_pkey primary key (workspace_id, id);
  end if;

  -- 8. Re-add the deferred tree FKs.
  if not exists (
    select 1 from pg_constraint
    where conrelid = to_regclass('public.content_nodes') and conname = 'content_nodes_parent_fk'
  ) then
    alter table public.content_nodes add constraint content_nodes_parent_fk
      foreign key (workspace_id, parent_id)
      references public.content_nodes (workspace_id, id)
      on delete cascade deferrable initially deferred;
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = to_regclass('public.documents') and conname = 'documents_node_fk'
  ) then
    alter table public.documents add constraint documents_node_fk
      foreign key (workspace_id, node_id)
      references public.content_nodes (workspace_id, id)
      on delete cascade deferrable initially deferred;
  end if;
end $$;

-- Indexes come after the legacy column rename, so they also work on old tables.
create index if not exists content_nodes_parent_idx on public.content_nodes (workspace_id, parent_id, sort_order);
create index if not exists content_nodes_type_idx   on public.content_nodes (workspace_id, type);
create index if not exists assets_node_idx          on public.assets (workspace_id, node_id);

-- ============================================================================
-- RLS: enabled, but every request (anon or signed in) shares the notebook.
-- ============================================================================
alter table public.content_nodes  enable row level security;
alter table public.documents      enable row level security;
alter table public.assets         enable row level security;
alter table public.import_history enable row level security;

drop policy if exists "own content nodes"  on public.content_nodes;
drop policy if exists "own documents"      on public.documents;
drop policy if exists "own assets"         on public.assets;
drop policy if exists "own import history" on public.import_history;

drop policy if exists "shared content nodes"  on public.content_nodes;
drop policy if exists "shared documents"      on public.documents;
drop policy if exists "shared assets"         on public.assets;
drop policy if exists "shared import history" on public.import_history;

create policy "shared content nodes" on public.content_nodes
  for all to anon, authenticated using (true) with check (true);

create policy "shared documents" on public.documents
  for all to anon, authenticated using (true) with check (true);

create policy "shared assets" on public.assets
  for all to anon, authenticated using (true) with check (true);

create policy "shared import history" on public.import_history
  for all to anon, authenticated using (true) with check (true);

-- ---------------------------------------------------------------- grants
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.content_nodes  to anon, authenticated;
grant select, insert, update, delete on public.documents      to anon, authenticated;
grant select, insert, update, delete on public.assets         to anon, authenticated;
grant select, insert, update, delete on public.import_history to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

-- ---------------------------------------------------------------- storage
-- The bucket is public (images are readable by URL) and world-writable, so
-- anonymous editors can upload and remove pictures too.
insert into storage.buckets (id, name, public)
values ('note-assets', 'note-assets', true)
on conflict (id) do update set public = true;

drop policy if exists "note assets read"        on storage.objects;
drop policy if exists "note assets write"       on storage.objects;
drop policy if exists "note assets update"      on storage.objects;
drop policy if exists "note assets delete"      on storage.objects;
drop policy if exists "note assets own read"    on storage.objects;
drop policy if exists "note assets own write"   on storage.objects;
drop policy if exists "note assets own update"  on storage.objects;
drop policy if exists "note assets own delete"  on storage.objects;

create policy "note assets read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'note-assets');

create policy "note assets write" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'note-assets');

create policy "note assets update" on storage.objects
  for update to anon, authenticated
  using (bucket_id = 'note-assets')
  with check (bucket_id = 'note-assets');

create policy "note assets delete" on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'note-assets');

-- ============================================================================
-- Keep updated_at fresh on documents
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
