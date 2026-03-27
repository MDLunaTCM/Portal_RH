-- TASK-016: Employee directory — read access for authenticated employees
--
-- Problem:
--   The existing RLS policies on `profiles` only allow:
--     - profiles_self_select  → user reads own row
--     - profiles_hr_select_all → hr_admin/super_admin reads all rows
--
--   Regular employees and managers cannot query other profiles, so the
--   directory page returns an empty result for non-HR users.
--
-- Solution:
--   Add a directory policy that allows ANY authenticated user to read
--   profiles that are marked as active. This is appropriate for an
--   internal employee directory — contact info (name, position, email,
--   phone) is not sensitive in a corporate intranet context.
--
--   The policy is intentionally broad (all active rows, all columns)
--   because Supabase RLS is row-level only. Sensitive columns like `role`
--   should be excluded at the application layer (not displayed in the UI).
--
-- Note:
--   Multiple SELECT policies on the same table are evaluated with OR logic
--   in Supabase/PostgreSQL. This policy coexists safely with the existing
--   profiles_self_select and profiles_hr_select_all policies.
-- -----------------------------------------------------------------------

create policy "profiles_directory_select"
  on public.profiles for select
  using (
    auth.uid() is not null
    and is_active = true
  );
