-- Todos table (global agency, not per-client)
create table todos (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  owner_id uuid not null references auth.users(id) on delete cascade
);

-- RLS
alter table todos enable row level security;

create policy "todos: owner can all"
  on todos for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Index for fast user queries
create index todos_owner_id_idx on todos (owner_id, done, created_at);
