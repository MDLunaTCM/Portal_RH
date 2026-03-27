-- ============================================================
-- TASK-006: RLS policies for sensitive tables
-- ============================================================
-- Run order: 5 (after 004_enable_rls)
--
-- Tables covered:
--   requests            — employee requests (vacation, letters, etc.)
--   request_attachments — files attached to requests
--   payroll_receipts    — salary receipts per period
--   employee_documents  — expediente personal (contracts, IDs, certs)
--   audit_logs          — immutable action trail
--
-- Prerequisites from migration 004:
--   has_role(roles user_role[]) — checks current user's role
--   is_direct_manager_of(employee_id) — defined below (new helper)
-- ============================================================

-- -----------------------------------------------------------------------
-- Additional helper: is_direct_manager_of
-- Returns true if auth.uid() is the direct manager of the given employee.
-- Used by requests + attachments policies for manager-team access.
-- -----------------------------------------------------------------------

create or replace function public.is_direct_manager_of(employee_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = employee_profile_id
      and p.manager_id = auth.uid()
  );
$$;

-- -----------------------------------------------------------------------
-- Additional helper: can_access_request
-- Returns true if the current user may see the given request row.
-- Inherited by request_attachments to avoid policy duplication.
-- -----------------------------------------------------------------------

create or replace function public.can_access_request(req_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.requests r
    where r.id = req_id
      and (
        r.employee_id = auth.uid()                                           -- own request
        or has_role(array['hr_admin', 'super_admin']::public.user_role[])    -- HR sees all
        or (                                                                   -- manager sees team
          has_role(array['manager']::public.user_role[])
          and is_direct_manager_of(r.employee_id)
        )
      )
  );
$$;

-- ============================================================
-- REQUESTS
-- ============================================================

-- -----------------------------------------------------------------------
-- SELECT
-- -----------------------------------------------------------------------

-- All roles: can see their own requests
create policy "requests_own_select"
  on public.requests for select
  using (employee_id = auth.uid());

-- Manager: can also see their direct reports' requests
create policy "requests_manager_team_select"
  on public.requests for select
  using (
    has_role(array['manager']::public.user_role[])
    and is_direct_manager_of(employee_id)
  );

-- HR Admin / Super Admin: see everything
create policy "requests_hr_select_all"
  on public.requests for select
  using (has_role(array['hr_admin', 'super_admin']::public.user_role[]));

-- -----------------------------------------------------------------------
-- INSERT
-- -----------------------------------------------------------------------

-- Any authenticated user can create a request for themselves
create policy "requests_own_insert"
  on public.requests for insert
  with check (employee_id = auth.uid());

-- HR / Super Admin can create requests on behalf of any employee
create policy "requests_hr_insert"
  on public.requests for insert
  with check (has_role(array['hr_admin', 'super_admin']::public.user_role[]));

-- -----------------------------------------------------------------------
-- UPDATE
-- -----------------------------------------------------------------------

-- Employee: can update own requests (edit notes, cancel).
-- The application layer is responsible for restricting which fields
-- can be set (employees must not touch reviewer_notes / reviewed_at).
create policy "requests_own_update"
  on public.requests for update
  using (employee_id = auth.uid());

-- Manager: can update their team's requests (to approve/reject/comment)
create policy "requests_manager_team_update"
  on public.requests for update
  using (
    has_role(array['manager']::public.user_role[])
    and is_direct_manager_of(employee_id)
  );

-- HR / Super Admin: can update any request
create policy "requests_hr_update"
  on public.requests for update
  using (has_role(array['hr_admin', 'super_admin']::public.user_role[]));

-- -----------------------------------------------------------------------
-- DELETE — hard-delete restricted to super_admin only.
-- Normal flow uses status = 'cancelled' (soft-delete).
-- -----------------------------------------------------------------------

create policy "requests_superadmin_delete"
  on public.requests for delete
  using (has_role(array['super_admin']::public.user_role[]));

-- ============================================================
-- REQUEST ATTACHMENTS
-- ============================================================
-- Visibility inherits from the parent request via can_access_request().

-- SELECT: can see attachment if you can see the parent request
create policy "req_attachments_select"
  on public.request_attachments for select
  using (can_access_request(request_id));

-- INSERT: can upload to a request you are involved in, and uploaded_by = self
create policy "req_attachments_insert"
  on public.request_attachments for insert
  with check (
    uploaded_by = auth.uid()
    and can_access_request(request_id)
  );

-- DELETE: uploader can remove own attachment; HR can remove any
create policy "req_attachments_own_delete"
  on public.request_attachments for delete
  using (uploaded_by = auth.uid());

create policy "req_attachments_hr_delete"
  on public.request_attachments for delete
  using (has_role(array['hr_admin', 'super_admin']::public.user_role[]));

-- ============================================================
-- PAYROLL RECEIPTS
-- ============================================================
-- Payroll data is strictly personal — managers do NOT see their
-- team members' salaries (salary privacy).

-- SELECT: each employee sees only their own receipts
create policy "payroll_own_select"
  on public.payroll_receipts for select
  using (employee_id = auth.uid());

-- SELECT: HR sees all receipts
create policy "payroll_hr_select_all"
  on public.payroll_receipts for select
  using (has_role(array['hr_admin', 'super_admin']::public.user_role[]));

-- INSERT: only HR / Super Admin can upload payroll receipts
create policy "payroll_hr_insert"
  on public.payroll_receipts for insert
  with check (has_role(array['hr_admin', 'super_admin']::public.user_role[]));

-- UPDATE: only HR / Super Admin (e.g., correct a wrong amount)
create policy "payroll_hr_update"
  on public.payroll_receipts for update
  using (has_role(array['hr_admin', 'super_admin']::public.user_role[]));

-- DELETE: only super_admin can hard-delete payroll records
create policy "payroll_superadmin_delete"
  on public.payroll_receipts for delete
  using (has_role(array['super_admin']::public.user_role[]));

-- ============================================================
-- EMPLOYEE DOCUMENTS (Expediente personal)
-- ============================================================
-- Same salary-privacy principle: managers do NOT read team members'
-- personal documents. Only HR / Super Admin have cross-employee access.

-- SELECT: employee sees own documents
create policy "employee_docs_own_select"
  on public.employee_documents for select
  using (employee_id = auth.uid());

-- SELECT: HR sees all documents
create policy "employee_docs_hr_select_all"
  on public.employee_documents for select
  using (has_role(array['hr_admin', 'super_admin']::public.user_role[]));

-- INSERT: employee can upload to their own folder (uploaded_by = self)
create policy "employee_docs_own_insert"
  on public.employee_documents for insert
  with check (
    employee_id = auth.uid()
    and uploaded_by = auth.uid()
  );

-- INSERT: HR can upload documents to any employee's folder
create policy "employee_docs_hr_insert"
  on public.employee_documents for insert
  with check (has_role(array['hr_admin', 'super_admin']::public.user_role[]));

-- UPDATE: HR can update status, add notes, approve/reject documents.
-- Employees cannot update document status (prevents self-approval).
create policy "employee_docs_hr_update"
  on public.employee_documents for update
  using (has_role(array['hr_admin', 'super_admin']::public.user_role[]));

-- DELETE: only super_admin can hard-delete documents
create policy "employee_docs_superadmin_delete"
  on public.employee_documents for delete
  using (has_role(array['super_admin']::public.user_role[]));

-- ============================================================
-- AUDIT LOGS
-- ============================================================
-- Audit logs are an immutable trail.
--
-- READ:   only super_admin
-- WRITE:  no client INSERT policy — audit writes MUST use the
--         Supabase service-role key (lib/supabase/admin.ts), which
--         bypasses RLS. This prevents authenticated users from
--         tampering with or forging log entries.
--         See TASK-026 for the audit-logging implementation.

-- SELECT: only super_admin
create policy "audit_logs_superadmin_select"
  on public.audit_logs for select
  using (has_role(array['super_admin']::public.user_role[]));

-- No INSERT / UPDATE / DELETE policies for the authenticated role.
-- The application uses createAdminClient() (service_role) to write logs.
