create extension if not exists "pgcrypto";

do $$
begin
  create type public.plan_type as enum ('free', 'pro');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.job_status as enum ('queued', 'processing', 'completed', 'failed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.file_kind as enum ('upload', 'artifact');
exception
  when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  plan public.plan_type not null default 'free',
  created_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  converter_slug text not null,
  status public.job_status not null default 'queued',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  error text,
  total_files integer,
  processed_files integer
);

create table public.files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  kind public.file_kind not null,
  bucket text not null,
  key text not null,
  original_name text,
  size_bytes bigint,
  mime text,
  retained boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.job_artifacts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  file_id uuid not null references public.files(id) on delete cascade,
  label text,
  created_at timestamptz not null default now()
);

create table public.usage_counters (
  user_id uuid primary key references auth.users(id) on delete cascade,
  period_start date not null default current_date,
  bytes_used bigint not null default 0,
  jobs_used integer not null default 0
);

create index jobs_user_id_created_at_idx on public.jobs (user_id, created_at);
create index files_user_id_created_at_idx on public.files (user_id, created_at);

create trigger jobs_set_updated_at
before update on public.jobs
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.files enable row level security;
alter table public.job_artifacts enable row level security;
alter table public.usage_counters enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
using (id = auth.uid());

create policy "profiles_insert_own"
on public.profiles
for insert
with check (id = auth.uid());

create policy "profiles_update_own"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "profiles_delete_own"
on public.profiles
for delete
using (id = auth.uid());

create policy "jobs_select_own"
on public.jobs
for select
using (user_id = auth.uid());

create policy "jobs_insert_own"
on public.jobs
for insert
with check (user_id = auth.uid());

create policy "jobs_update_own"
on public.jobs
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "jobs_delete_own"
on public.jobs
for delete
using (user_id = auth.uid());

create policy "files_select_own"
on public.files
for select
using (user_id = auth.uid());

create policy "files_insert_own"
on public.files
for insert
with check (user_id = auth.uid());

create policy "files_update_own"
on public.files
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "files_delete_own"
on public.files
for delete
using (user_id = auth.uid());

create policy "job_artifacts_select_own"
on public.job_artifacts
for select
using (
  exists (
    select 1
    from public.jobs
    where public.jobs.id = job_artifacts.job_id
      and public.jobs.user_id = auth.uid()
  )
);

create policy "job_artifacts_insert_own"
on public.job_artifacts
for insert
with check (
  exists (
    select 1
    from public.jobs
    where public.jobs.id = job_artifacts.job_id
      and public.jobs.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.files
    where public.files.id = job_artifacts.file_id
      and public.files.user_id = auth.uid()
  )
);

create policy "job_artifacts_update_own"
on public.job_artifacts
for update
using (
  exists (
    select 1
    from public.jobs
    where public.jobs.id = job_artifacts.job_id
      and public.jobs.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.jobs
    where public.jobs.id = job_artifacts.job_id
      and public.jobs.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.files
    where public.files.id = job_artifacts.file_id
      and public.files.user_id = auth.uid()
  )
);

create policy "job_artifacts_delete_own"
on public.job_artifacts
for delete
using (
  exists (
    select 1
    from public.jobs
    where public.jobs.id = job_artifacts.job_id
      and public.jobs.user_id = auth.uid()
  )
);

create policy "usage_counters_select_own"
on public.usage_counters
for select
using (user_id = auth.uid());

create policy "usage_counters_insert_own"
on public.usage_counters
for insert
with check (user_id = auth.uid());

create policy "usage_counters_update_own"
on public.usage_counters
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "usage_counters_delete_own"
on public.usage_counters
for delete
using (user_id = auth.uid());
