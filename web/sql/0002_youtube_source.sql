-- Phase 1.5: YouTube 자막 추출 지원
-- 기존 jobs 에 source / source_url 추가. 기존 row 는 'upload' 기본값.

alter table public.jobs
  add column if not exists source text default 'upload',
  add column if not exists source_url text;

alter table public.jobs
  drop constraint if exists jobs_source_check;

alter table public.jobs
  add constraint jobs_source_check
  check (source in ('upload', 'youtube'));

create index if not exists jobs_source_idx
  on public.jobs (source, created_at desc);
