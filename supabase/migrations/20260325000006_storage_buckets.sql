-- ============================================================
-- TASK-007: Storage buckets + RLS policies
-- ============================================================
-- Run order: 6 (after 005_rls_sensitive_tables)
--
-- Buckets created:
--   payroll-receipts     — salary PDFs, HR-upload only, employee + HR read
--   employee-documents   — personal docs, employee + HR upload, no manager access
--   policies             — company policies, all employees read, HR manages
--   request-attachments  — files attached to requests, inherits request visibility
--
-- Path conventions (enforced by application layer + RLS):
--   payroll-receipts    → {employee_id}/{period}/{filename}
--   employee-documents  → {employee_id}/{category}/{filename}
--   policies            → {category}/{filename}
--   request-attachments → {request_id}/{filename}
--
-- Salary privacy: managers do NOT get access to payroll-receipts or
-- employee-documents (mirrors the DB-level RLS from migration 005).
-- ============================================================

-- -----------------------------------------------------------------------
-- Buckets
-- -----------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'payroll-receipts',
    'payroll-receipts',
    false,
    10485760,  -- 10 MB
    array['application/pdf']
  ),
  (
    'employee-documents',
    'employee-documents',
    false,
    20971520,  -- 20 MB
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'policies',
    'policies',
    false,
    20971520,  -- 20 MB
    array['application/pdf']
  ),
  (
    'request-attachments',
    'request-attachments',
    false,
    10485760,  -- 10 MB
    array[
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  )
on conflict (id) do nothing;

-- ============================================================
-- PAYROLL RECEIPTS
-- Path: {employee_id}/{period}/{filename}
-- ============================================================
-- Salary data is strictly personal.
-- Managers do NOT see their team's payroll (salary privacy).
-- Only HR / super_admin uploads payroll PDFs.

create policy "payroll_receipts_storage_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'payroll-receipts'
    and (
      -- employee sees their own files (first path segment = their UUID)
      split_part(name, '/', 1) = auth.uid()::text
      -- HR and super_admin see all
      or public.has_role(array['hr_admin', 'super_admin']::public.user_role[])
    )
  );

create policy "payroll_receipts_storage_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'payroll-receipts'
    and public.has_role(array['hr_admin', 'super_admin']::public.user_role[])
  );

-- No UPDATE policy — payroll receipts are immutable once uploaded.
-- HR must delete and re-upload to correct an error.

create policy "payroll_receipts_storage_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'payroll-receipts'
    and public.has_role(array['super_admin']::public.user_role[])
  );

-- ============================================================
-- EMPLOYEE DOCUMENTS
-- Path: {employee_id}/{category}/{filename}
-- ============================================================
-- Personal documents (contracts, ID copies, certifications).
-- Salary privacy applies: managers do NOT have access.
-- Employee can read and upload to their own folder.
-- HR can read and upload to any folder.
-- Only super_admin can hard-delete.

create policy "employee_docs_storage_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'employee-documents'
    and (
      split_part(name, '/', 1) = auth.uid()::text
      or public.has_role(array['hr_admin', 'super_admin']::public.user_role[])
    )
  );

create policy "employee_docs_storage_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'employee-documents'
    and (
      -- employee uploads to their own folder
      split_part(name, '/', 1) = auth.uid()::text
      -- HR uploads to any employee's folder
      or public.has_role(array['hr_admin', 'super_admin']::public.user_role[])
    )
  );

-- UPDATE: HR can rename/replace metadata; employees cannot self-approve docs
create policy "employee_docs_storage_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'employee-documents'
    and public.has_role(array['hr_admin', 'super_admin']::public.user_role[])
  );

create policy "employee_docs_storage_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'employee-documents'
    and public.has_role(array['super_admin']::public.user_role[])
  );

-- ============================================================
-- POLICIES
-- Path: {category}/{filename}
-- ============================================================
-- Company policy PDFs (reglamentos, manuales, etc.).
-- All authenticated employees can read.
-- Only HR / super_admin manages content.

create policy "policies_storage_select"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'policies');

create policy "policies_storage_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'policies'
    and public.has_role(array['hr_admin', 'super_admin']::public.user_role[])
  );

create policy "policies_storage_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'policies'
    and public.has_role(array['hr_admin', 'super_admin']::public.user_role[])
  );

create policy "policies_storage_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'policies'
    and public.has_role(array['super_admin']::public.user_role[])
  );

-- ============================================================
-- REQUEST ATTACHMENTS
-- Path: {request_id}/{filename}
-- ============================================================
-- Files attached to employee requests (vacation, letters, etc.).
-- Visibility inherits from the parent request via can_access_request().
--
-- UUID guard: validate first segment before casting to uuid to prevent
-- Postgres errors if a malformed path reaches the policy.

create policy "req_attachments_storage_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'request-attachments'
    and (split_part(name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
    and public.can_access_request(split_part(name, '/', 1)::uuid)
  );

create policy "req_attachments_storage_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'request-attachments'
    and (split_part(name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
    and public.can_access_request(split_part(name, '/', 1)::uuid)
  );

create policy "req_attachments_storage_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'request-attachments'
    and (
      -- uploader can remove their own attachment
      owner = auth.uid()
      -- HR can remove any attachment
      or public.has_role(array['hr_admin', 'super_admin']::public.user_role[])
    )
  );
