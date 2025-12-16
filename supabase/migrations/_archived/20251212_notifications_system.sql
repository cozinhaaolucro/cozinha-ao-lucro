create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  title text not null,
  message text not null,
  type text check (type in ('info', 'warning', 'success', 'error')) default 'info',
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "System can insert notifications"
  on public.notifications for insert
  with check (true);
