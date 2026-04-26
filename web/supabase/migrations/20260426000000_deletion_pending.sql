-- Phase 1.6: 원본 Blob 삭제 실패 시 재시도 큐
-- jobs.deletion_pending=true 인 행을 cron 이 회수해 재삭제한다.

alter table public.jobs
  add column if not exists deletion_pending boolean not null default false;

create index if not exists jobs_deletion_pending_idx
  on public.jobs (deletion_pending)
  where deletion_pending = true;
