-- ============================================================
-- TASK-003: Triggers — Portal RH MVP
-- ============================================================
-- Run order: 2 of 3 (schema → triggers → seed)
-- ============================================================

-- ============================================================
-- FUNCTION: set_updated_at
-- Keeps updated_at in sync on every row update.
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Attach to every table that has updated_at

create trigger trg_departments_updated_at
  before update on public.departments
  for each row execute function public.set_updated_at();

create trigger trg_positions_updated_at
  before update on public.positions
  for each row execute function public.set_updated_at();

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_request_types_updated_at
  before update on public.request_types
  for each row execute function public.set_updated_at();

create trigger trg_requests_updated_at
  before update on public.requests
  for each row execute function public.set_updated_at();

create trigger trg_payroll_receipts_updated_at
  before update on public.payroll_receipts
  for each row execute function public.set_updated_at();

create trigger trg_employee_documents_updated_at
  before update on public.employee_documents
  for each row execute function public.set_updated_at();

create trigger trg_announcements_updated_at
  before update on public.announcements
  for each row execute function public.set_updated_at();

create trigger trg_policies_updated_at
  before update on public.policies
  for each row execute function public.set_updated_at();

-- ============================================================
-- FUNCTION: handle_new_user
-- Automatically creates a profile row when a user signs up
-- via Supabase Auth. Reads first_name / last_name from
-- user_metadata if provided (e.g. from admin invite flow).
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    role
  ) values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(
      (new.raw_user_meta_data->>'role')::public.user_role,
      'employee'
    )
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
