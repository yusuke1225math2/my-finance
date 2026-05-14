create table if not exists expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  date        date not null,
  amount      integer not null,
  store       text not null,
  category    text,
  memo        text,
  created_at  timestamptz default now()
);

alter table expenses enable row level security;

create policy "own data only"
  on expenses
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index expenses_user_date_idx on expenses (user_id, date desc, created_at desc);
