-- Create subscriptions table
create type plan_type as enum ('free', 'pro', 'premium');
create type subscription_status as enum ('active', 'past_due', 'canceled', 'trialing');

create table public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  plan_id plan_type not null default 'free',
  status subscription_status not null default 'active',
  current_period_start timestamp with time zone default now(),
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  stripe_customer_id text,
  stripe_subscription_id text
);

-- Enable RLS
alter table public.subscriptions enable row level security;

create policy "Users can view their own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Create simple Usage Counters (in a real app, you might query counts directly, but caching here helps)
create table public.usage_metrics (
  user_id uuid references auth.users(id) on delete cascade primary key,
  orders_count_month integer default 0,
  products_count_total integer default 0,
  customers_count_total integer default 0,
  last_updated timestamp with time zone default now()
);

alter table public.usage_metrics enable row level security;

create policy "Users can view their own metrics"
  on public.usage_metrics for select
  using (auth.uid() = user_id);

-- Function to handle new user signup -> Create Free Subscription
create or replace function public.handle_new_user_subscription() 
returns trigger as $$
begin
  insert into public.subscriptions (user_id, plan_id, status)
  values (new.id, 'free', 'active');
  
  insert into public.usage_metrics (user_id)
  values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
-- drop trigger if exists on_auth_user_created_subscription on auth.users;
-- create trigger on_auth_user_created_subscription
--   after insert on auth.users
--   for each row execute procedure public.handle_new_user_subscription();
