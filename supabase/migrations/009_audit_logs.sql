-- Immutable audit log for admin and moderator actions
create table audit_logs (
  id           uuid        primary key default gen_random_uuid(),
  actor_id     uuid        references profiles(id) on delete set null,
  action       text        not null,
  target_type  text        not null,
  target_id    uuid,
  community_id uuid        references communities(id) on delete set null,
  metadata     jsonb       not null default '{}',
  created_at   timestamptz not null default now()
);

alter table audit_logs enable row level security;

-- Only platform admins can read
create policy "platform admins read audit logs"
  on audit_logs for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and is_platform_admin = true
    )
  );

-- Authenticated users (server actions) can insert
create policy "authenticated insert audit logs"
  on audit_logs for insert
  with check (auth.uid() is not null);

-- No updates or deletes — append-only
