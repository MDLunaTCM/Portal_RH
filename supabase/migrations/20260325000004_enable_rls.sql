-- ============================================================
-- TASK-005: Enable RLS and define auth helpers
-- ============================================================
-- Run order: 4 of 4 (after schema → triggers → seed)
--
-- Strategy:
--   1. Enable RLS on all 11 MVP tables (default: deny all).
--   2. Create helper functions consumed by policies.
--   3. Add policies for lookup/reference tables (anyone authenticated).
--   4. Add self-read + hr-read policies for profiles (required for
--      SessionProvider hydration and the employee directory).
--   5. Sensitive tables (requests, payroll, documents, audit_logs)
--      receive detailed per-role policies in TASK-006.
-- ============================================================

-- -----------------------------------------------------------------------
-- 1. Enable RLS on all MVP tables
-- -----------------------------------------------------------------------

alter table public.departments        enable row level security;
alter table public.positions          enable row level security;
alter table public.profiles           enable row level security;
alter table public.request_types      enable row level security;
alter table public.requests           enable row level security;
alter table public.request_attachments enable row level security;
alter table public.payroll_receipts   enable row level security;
alter table public.employee_documents enable row level security;
alter table public.announcements      enable row level security;
alter table public.policies           enable row level security;
alter table public.audit_logs         enable row level security;

-- -----------------------------------------------------------------------
-- 2. Helper functions
-- Used by RLS policies to read the current user's role without
-- repeated sub-selects in every policy expression.
-- Both functions are SECURITY DEFINER so they bypass RLS on profiles
-- when called from within a policy — preventing infinite recursion.
-- -----------------------------------------------------------------------

-- Returns the current user's role (or NULL if unauthenticated / no profile).
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid();
$$;

-- Returns true if the current user has any of the given roles.
create or replace function public.has_role(roles public.user_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = any(roles)
  );
$$;

-- -----------------------------------------------------------------------
-- 3. Lookup / reference table policies
-- All authenticated users can read these non-sensitive tables.
-- Write access is restricted to hr_admin and super_admin.
-- -----------------------------------------------------------------------

-- departments
create policy "departments_authenticated_read"
  on public.departments for select
  using (auth.uid() is not null);

create policy "departments_hr_write"
  on public.departments for all
  using (has_role(array['hr_admin', 'super_admin']::public.user_role[]))
  with check (has_role(array['hr_admin', 'super_admin']::public.user_role[]));

-- positions
create policy "positions_authenticated_read"
  on public.positions for select
  using (auth.uid() is not null);

create policy "positions_hr_write"
  on public.positions for all
  using (has_role(array['hr_admin', 'super_admin']::public.user_role[]))
  with check (has_role(array['hr_admin', 'super_admin']::public.user_role[]));

-- request_types (catalog — read-only for all authenticated users)
create policy "request_types_authenticated_read"
  on public.request_types for select
  using (auth.uid() is not null and is_active = true);

create policy "request_types_hr_write"
  on public.request_types for all
  using (has_role(array['hr_admin', 'super_admin']::public.user_role[]))
  with check (has_role(array['hr_admin', 'super_admin']::public.user_role[]));

-- announcements (published ones are visible to all authenticated users)
create policy "announcements_published_read"
  on public.announcements for select
  using (
    auth.uid() is not null
    and status = 'published'
    and (expires_at is null or expires_at > now())
  );

create policy "announcements_hr_all"
  on public.announcements for all
  using (has_role(array['hr_admin', 'super_admin']::public.user_role[]))
  with check (has_role(array['hr_admin', 'super_admin']::public.user_role[]));

-- policies / reglamentos (published ones visible to all authenticated users)
create policy "policies_published_read"
  on public.policies for select
  using (
    auth.uid() is not null
    and status = 'published'
  );

create policy "policies_hr_all"
  on public.policies for all
  using (has_role(array['hr_admin', 'super_admin']::public.user_role[]))
  with check (has_role(array['hr_admin', 'super_admin']::public.user_role[]));

-- -----------------------------------------------------------------------
-- 4. Profiles policies
-- Self-read is critical: SessionProvider calls
--   supabase.from("profiles").select("*").eq("id", user.id)
-- Without this policy the session hydration fails after login.
-- -----------------------------------------------------------------------

-- Any user can read their own profile
create policy "profiles_self_select"
  on public.profiles for select
  using (id = auth.uid());

-- hr_admin / super_admin can read all profiles (directory, HR panel, approvals)
create policy "profiles_hr_select_all"
  on public.profiles for select
  using (has_role(array['hr_admin', 'super_admin']::public.user_role[]));

-- Any user can update their own non-role fields.
-- The WITH CHECK prevents self-escalation of role.
create policy "profiles_self_update"
  on public.profiles for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select role from public.profiles where id = auth.uid())
  );

-- hr_admin / super_admin can insert and update any profile
create policy "profiles_hr_write"
  on public.profiles for all
  using (has_role(array['hr_admin', 'super_admin']::public.user_role[]))
  with check (has_role(array['hr_admin', 'super_admin']::public.user_role[]));

-- handle_new_user() trigger needs INSERT on profiles.
-- The trigger runs as SECURITY DEFINER, so it bypasses RLS automatically.
-- No extra policy needed.

-- -----------------------------------------------------------------------
-- NOTE: The following tables have RLS enabled but no policies yet.
-- All access is denied until TASK-006 adds the per-role policies.
--   - requests
--   - request_attachments
--   - payroll_receipts
--   - employee_documents
--   - audit_logs
-- -----------------------------------------------------------------------
