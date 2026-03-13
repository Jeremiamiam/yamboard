-- 030: Add client_id to todos for @mention linking
alter table todos
  add column client_id uuid references clients(id) on delete set null;

create index todos_client_id_idx on todos (client_id) where client_id is not null;
