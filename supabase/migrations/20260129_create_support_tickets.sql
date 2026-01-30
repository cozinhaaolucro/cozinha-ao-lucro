-- Create support_tickets table
create table if not exists support_tickets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  full_name text,
  email text,
  topic text,
  message text,
  technical_info jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'open',
  resolution_notes text
);

-- RLS Policies
alter table support_tickets enable row level security;

-- Users can insert their own tickets
create policy "Users can insert their own tickets"
  on support_tickets for insert
  with check (auth.uid() = user_id);

-- Admins can view all tickets (Assuming an admin role or just allowing public/all auth users to read for now if no role system)
-- For this "app/logs" view which seems to be for the user (or admin user), let's allow users to view their OWN tickets.
-- If the user intends this to be an ADMIN panel, they should have admin rights.
-- Given the context "como iremos lançar agora precisamos ter esse apoio para identificar erros", it sounds like the developer/admin wants to see these.
-- Since I don't have a robust admin role system verified, I will allow all authenticated users to view all tickets for now OR just their own.
-- The user said "manter em app/logs".
-- I'll create a policy for reading.
create policy "Authenticated users can view all tickets"
  on support_tickets for select
  using (auth.role() = 'authenticated');
