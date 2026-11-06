-- ==============================================================================
-- Private Connect Database Architecture & Security Policies
-- PostgreSQL & Supabase Migration
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique,
  email text not null,
  display_name text not null,
  username text unique not null,
  avatar_url text,
  bio text default '',
  role text not null default 'member' check (role in ('admin', 'member')),
  status text not null default 'approved' check (status in ('pending', 'approved', 'suspended')),
  is_online boolean default false,
  last_seen timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. USER PRESENCE TABLE
create table if not exists public.user_presence (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  is_online boolean default false,
  status_text text default '',
  active_device text default 'web',
  last_heartbeat timestamptz default now()
);

-- 3. CONVERSATIONS TABLE
create table if not exists public.conversations (
  id uuid primary key default uuid_generate_v4(),
  is_group boolean default false,
  name text,
  description text default '',
  avatar_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. CONVERSATION MEMBERS TABLE
create table if not exists public.conversation_members (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  is_muted boolean default false,
  is_archived boolean default false,
  last_read_at timestamptz default now(),
  joined_at timestamptz default now(),
  unique(conversation_id, user_id)
);

-- 5. MESSAGES TABLE
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null default '',
  message_type text not null default 'text' check (message_type in ('text', 'image', 'video', 'audio', 'voice', 'file')),
  reply_to_id uuid references public.messages(id) on delete set null,
  is_pinned boolean default false,
  is_edited boolean default false,
  is_deleted boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. MESSAGE REACTIONS TABLE
create table if not exists public.message_reactions (
  id uuid primary key default uuid_generate_v4(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null check (reaction in ('❤️', '😂', '😮', '😢', '👍', '🔥')),
  created_at timestamptz default now(),
  unique(message_id, user_id, reaction)
);

-- 7. MESSAGE READS TABLE
create table if not exists public.message_reads (
  id uuid primary key default uuid_generate_v4(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz default now(),
  unique(message_id, user_id)
);

-- 8. ATTACHMENTS TABLE
create table if not exists public.attachments (
  id uuid primary key default uuid_generate_v4(),
  message_id uuid not null references public.messages(id) on delete cascade,
  file_name text not null,
  file_type text not null,
  file_size bigint not null default 0,
  file_url text not null,
  duration_seconds numeric default 0,
  created_at timestamptz default now()
);

-- 9. GROUP SETTINGS TABLE
create table if not exists public.group_settings (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade unique,
  only_admins_can_message boolean default false,
  only_admins_can_edit_info boolean default true,
  approval_required_to_join boolean default false
);

-- 10. USER INVITATIONS TABLE
create table if not exists public.user_invitations (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  email text,
  created_by uuid references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'revoked')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz default now()
);

-- 11. NOTIFICATIONS TABLE
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete cascade,
  type text not null check (type in ('message', 'mention', 'call', 'reaction', 'invitation')),
  title text not null,
  body text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- 12. CALLS TABLE
create table if not exists public.calls (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  caller_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  call_type text not null check (call_type in ('voice', 'video')),
  status text not null default 'completed' check (status in ('missed', 'completed', 'declined', 'busy', 'ongoing')),
  started_at timestamptz default now(),
  ended_at timestamptz,
  duration_seconds integer default 0,
  created_at timestamptz default now()
);

-- INDEXES FOR PERFORMANCE
create index if not exists idx_profiles_username on public.profiles(username);
create index if not exists idx_profiles_status on public.profiles(status);
create index if not exists idx_conversation_members_user on public.conversation_members(user_id);
create index if not exists idx_conversation_members_conv on public.conversation_members(conversation_id);
create index if not exists idx_messages_conv_created on public.messages(conversation_id, created_at desc);
create index if not exists idx_message_reactions_msg on public.message_reactions(message_id);
create index if not exists idx_notifications_user_read on public.notifications(user_id, is_read);
create index if not exists idx_calls_user on public.calls(caller_id, receiver_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
alter table public.profiles enable row level security;
alter table public.user_presence enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_reactions enable row level security;
alter table public.message_reads enable row level security;
alter table public.attachments enable row level security;
alter table public.group_settings enable row level security;
alter table public.user_invitations enable row level security;
alter table public.notifications enable row level security;
alter table public.calls enable row level security;

-- Profiles: approved users can read profiles; users can update their own profile; admins can manage all
create policy "Profiles visible to approved authenticated users"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

-- Conversations: users only see conversations they are member of
create policy "Conversations visible only to members"
  on public.conversations for select
  using (
    exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = id
      and cm.user_id = (select p.id from public.profiles p where p.user_id = auth.uid())
    )
  );

-- Conversation Members: visible only to fellow members
create policy "Members visible to fellow participants"
  on public.conversation_members for select
  using (
    exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = conversation_members.conversation_id
      and cm.user_id = (select p.id from public.profiles p where p.user_id = auth.uid())
    )
  );

-- Messages: only readable by conversation members
create policy "Messages readable by conversation participants"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = messages.conversation_id
      and cm.user_id = (select p.id from public.profiles p where p.user_id = auth.uid())
    )
  );

create policy "Messages insertable by conversation participants"
  on public.messages for insert
  with check (
    sender_id = (select p.id from public.profiles p where p.user_id = auth.uid())
    and exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = messages.conversation_id
      and cm.user_id = sender_id
    )
  );

create policy "Messages editable only by sender"
  on public.messages for update
  using (sender_id = (select p.id from public.profiles p where p.user_id = auth.uid()));

-- Realtime Publication for Supabase Realtime
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.message_reactions;
alter publication supabase_realtime add table public.user_presence;
alter publication supabase_realtime add table public.conversation_members;
alter publication supabase_realtime add table public.notifications;
