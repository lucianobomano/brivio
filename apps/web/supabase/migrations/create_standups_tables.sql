-- Create standup_teams table
create table if not exists public.standup_teams (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    leader_id uuid references auth.users(id) on delete
    set null,
        workspace_id uuid not null,
        -- references workspaces(id) if it exists, otherwise just uuid
        created_at timestamp with time zone default timezone('utc'::text, now()) not null,
        updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Create standup_team_members table
create table if not exists public.standup_team_members (
    id uuid default gen_random_uuid() primary key,
    team_id uuid references public.standup_teams(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(team_id, user_id)
);
-- Create standups table
create table if not exists public.standups (
    id uuid default gen_random_uuid() primary key,
    team_id uuid references public.standup_teams(id) on delete cascade not null,
    name text not null,
    frequency text default 'daily',
    reminder_time text,
    schedule_days text [],
    -- 'Mon', 'Tue', etc.
    questions jsonb default '[]'::jsonb,
    is_active boolean default true,
    target_audience text default 'leader',
    -- 'leader' or 'all'
    created_by uuid references auth.users(id),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Enable RLS
alter table public.standup_teams enable row level security;
alter table public.standup_team_members enable row level security;
alter table public.standups enable row level security;
-- Policies (simplified for development, restrict by workspace_members in prod)
create policy "Enable all access for authenticated users" on public.standup_teams for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.standup_team_members for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.standups for all using (auth.role() = 'authenticated');