-- ============================================================
-- TASK-003: Initial schema — Portal RH MVP
-- ============================================================
-- Run order: 1 of 3 (schema → triggers → seed)
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

create type public.user_role as enum (
  'employee',
  'manager',
  'hr_admin',
  'super_admin'
);

create type public.request_status as enum (
  'draft',
  'pending',
  'approved',
  'rejected',
  'cancelled'
);

create type public.document_status as enum (
  'active',
  'expired',
  'revoked'
);

create type public.publish_status as enum (
  'draft',
  'published',
  'archived'
);

create type public.audit_action as enum (
  'login',
  'logout',
  'create',
  'update',
  'delete',
  'download',
  'approve',
  'reject',
  'upload'
);

-- ============================================================
-- DEPARTMENTS
-- ============================================================

create table public.departments (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  code        text not null unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.departments is 'Organizational departments.';

-- ============================================================
-- POSITIONS
-- ============================================================

create table public.positions (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  department_id  uuid not null references public.departments (id) on delete restrict,
  level          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.positions is 'Job positions within a department.';

create index positions_department_idx on public.positions (department_id);

-- ============================================================
-- PROFILES
-- ============================================================

create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  employee_id     text unique,                         -- internal employee number
  first_name      text not null,
  last_name       text not null,
  email           text not null unique,
  phone           text,
  role            public.user_role not null default 'employee',
  department_id   uuid references public.departments (id) on delete set null,
  position_id     uuid references public.positions (id) on delete set null,
  manager_id      uuid references public.profiles (id) on delete set null,
  hire_date       date,
  avatar_url      text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.profiles is 'Extended user profile linked to auth.users.';

create index profiles_department_idx on public.profiles (department_id);
create index profiles_manager_idx    on public.profiles (manager_id);
create index profiles_role_idx       on public.profiles (role);

-- ============================================================
-- REQUEST TYPES
-- ============================================================

create table public.request_types (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,   -- e.g. 'vacation', 'employment_letter'
  name         text not null,
  description  text,
  requires_approval  boolean not null default true,
  is_active    boolean not null default true,
  metadata_schema    jsonb,            -- JSON Schema for type-specific fields
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.request_types is 'Catalog of available request types.';

-- ============================================================
-- REQUESTS
-- ============================================================

create table public.requests (
  id               uuid primary key default gen_random_uuid(),
  request_type_id  uuid not null references public.request_types (id) on delete restrict,
  employee_id      uuid not null references public.profiles (id) on delete restrict,
  reviewer_id      uuid references public.profiles (id) on delete set null,
  status           public.request_status not null default 'pending',
  metadata         jsonb not null default '{}',   -- type-specific fields
  notes            text,                           -- employee notes
  reviewer_notes   text,                           -- HR/manager notes on review
  reviewed_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.requests is 'Employee requests (vacations, letters, card replacements, etc.).';

create index requests_employee_idx     on public.requests (employee_id);
create index requests_reviewer_idx     on public.requests (reviewer_id);
create index requests_status_idx       on public.requests (status);
create index requests_type_idx         on public.requests (request_type_id);
create index requests_created_at_idx   on public.requests (created_at desc);

-- ============================================================
-- REQUEST ATTACHMENTS
-- ============================================================

create table public.request_attachments (
  id           uuid primary key default gen_random_uuid(),
  request_id   uuid not null references public.requests (id) on delete cascade,
  uploaded_by  uuid not null references public.profiles (id) on delete restrict,
  file_name    text not null,
  file_type    text not null,
  file_size    bigint not null,
  storage_path text not null,          -- path in Supabase Storage bucket
  created_at   timestamptz not null default now()
);

comment on table public.request_attachments is 'Files attached to a request (employee or HR uploads).';

create index request_attachments_request_idx on public.request_attachments (request_id);

-- ============================================================
-- PAYROLL RECEIPTS
-- ============================================================

create table public.payroll_receipts (
  id           uuid primary key default gen_random_uuid(),
  employee_id  uuid not null references public.profiles (id) on delete restrict,
  period       text not null,          -- e.g. '2026-01' (YYYY-MM)
  period_type  text not null default 'monthly',  -- 'monthly' | 'biweekly'
  gross_amount numeric(12, 2) not null,
  net_amount   numeric(12, 2) not null,
  concepts     jsonb not null default '[]',       -- array of PayrollConcept
  storage_path text not null,          -- PDF in Storage bucket
  issued_at    date not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  unique (employee_id, period, period_type)
);

comment on table public.payroll_receipts is 'Payroll receipts per employee per period.';

create index payroll_employee_idx on public.payroll_receipts (employee_id);
create index payroll_period_idx   on public.payroll_receipts (period desc);

-- ============================================================
-- EMPLOYEE DOCUMENTS
-- ============================================================

create table public.employee_documents (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid not null references public.profiles (id) on delete restrict,
  uploaded_by   uuid not null references public.profiles (id) on delete restrict,
  category      text not null,         -- 'id', 'contract', 'certificate', 'other'
  name          text not null,
  description   text,
  file_name     text not null,
  file_type     text not null,
  file_size     bigint not null,
  storage_path  text not null,
  status        public.document_status not null default 'active',
  expires_at    date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.employee_documents is 'Sensitive HR documents per employee (contracts, IDs, certificates).';

create index employee_docs_employee_idx on public.employee_documents (employee_id);
create index employee_docs_category_idx on public.employee_documents (category);
create index employee_docs_status_idx   on public.employee_documents (status);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================

create table public.announcements (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null references public.profiles (id) on delete restrict,
  title         text not null,
  body          text not null,
  category      text not null default 'general',  -- 'general' | 'urgent' | 'event'
  target_roles  public.user_role[] not null default '{employee,manager,hr_admin,super_admin}',
  status        public.publish_status not null default 'draft',
  pinned        boolean not null default false,
  published_at  timestamptz,
  expires_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.announcements is 'HR announcements visible to targeted roles.';

create index announcements_status_idx      on public.announcements (status);
create index announcements_published_idx   on public.announcements (published_at desc);

-- ============================================================
-- POLICIES
-- ============================================================

create table public.policies (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null references public.profiles (id) on delete restrict,
  title         text not null,
  description   text,
  category      text not null,         -- 'reglamento' | 'politica' | 'procedimiento'
  version       text not null default '1.0',
  file_name     text,
  file_type     text,
  file_size     bigint,
  storage_path  text,
  status        public.publish_status not null default 'draft',
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.policies is 'Company policies, regulations, and procedures.';

create index policies_status_idx    on public.policies (status);
create index policies_category_idx  on public.policies (category);

-- ============================================================
-- AUDIT LOGS
-- ============================================================

create table public.audit_logs (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references public.profiles (id) on delete set null,
  action       public.audit_action not null,
  resource     text not null,          -- table name or resource type
  resource_id  text,                   -- id of the affected row
  metadata     jsonb not null default '{}',
  ip_address   inet,
  user_agent   text,
  created_at   timestamptz not null default now()
);

comment on table public.audit_logs is 'Immutable audit trail for sensitive actions.';

create index audit_logs_actor_idx    on public.audit_logs (actor_id);
create index audit_logs_action_idx   on public.audit_logs (action);
create index audit_logs_resource_idx on public.audit_logs (resource, resource_id);
create index audit_logs_created_idx  on public.audit_logs (created_at desc);
