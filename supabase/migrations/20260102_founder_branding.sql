-- ==============================================================================
-- Private Connect Database Migration: Founder Administrator & Developer Branding
-- Version: 20260102
-- ==============================================================================

-- 1. ALTER PROFILES TABLE TO SUPPORT FOUNDER ROLE & REJECTED STATUS
do $$
begin
  -- Update role check constraint
  alter table public.profiles drop constraint if exists profiles_role_check;
  alter table public.profiles add constraint profiles_role_check
    check (role in ('founder', 'admin', 'member'));

  -- Update status check constraint
  alter table public.profiles drop constraint if exists profiles_status_check;
  alter table public.profiles add constraint profiles_status_check
    check (status in ('pending', 'approved', 'rejected', 'suspended'));
end $$;

-- 2. ADD FOUNDER & BRANDING METADATA COLUMNS
alter table public.profiles
  add column if not exists cover_url text default '',
  add column if not exists founder_title text default '',
  add column if not exists responsibility text default '',
  add column if not exists contact_links jsonb default '{"github": "https://github.com", "website": "https://privateconnect.internal", "email": "arafat@privateconnect.internal"}'::jsonb;

-- 3. PROVISION INITIAL FOUNDER PROFILE RECORD
insert into public.profiles (
  email,
  display_name,
  username,
  avatar_url,
  cover_url,
  bio,
  role,
  status,
  founder_title,
  responsibility,
  is_online
)
values (
  'arafat@privateconnect.internal',
  'Arafat Sani',
  'arafat_sani',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=ArafatSani',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
  'Founder & Lead Developer of Private Connect. Architect of secure real-time messaging, WebRTC calling, and private group governance.',
  'founder',
  'approved',
  'Founder & Lead Developer',
  'Product Development, Technical Architecture and Platform Management.',
  true
)
on conflict (username) do update set
  display_name = 'Arafat Sani',
  role = 'founder',
  status = 'approved',
  founder_title = 'Founder & Lead Developer',
  responsibility = 'Product Development, Technical Architecture and Platform Management.';

-- 4. HARDENED ROW LEVEL SECURITY POLICIES FOR FOUNDER & ADMINS
-- Ensure only founder can modify founder profile and founder privileges
create policy "Founder profile immutable by non-founders"
  on public.profiles for update
  using (
    (select role from public.profiles where user_id = auth.uid()) = 'founder'
    or (id = (select id from public.profiles where user_id = auth.uid()) and role != 'founder')
  );

-- Only approved users can view messages or participate in conversations
drop policy if exists "Conversations visible only to members" on public.conversations;
create policy "Conversations visible only to approved members"
  on public.conversations for select
  using (
    exists (
      select 1 from public.conversation_members cm
      join public.profiles p on p.id = cm.user_id
      where cm.conversation_id = id
      and p.user_id = auth.uid()
      and p.status = 'approved'
    )
  );
