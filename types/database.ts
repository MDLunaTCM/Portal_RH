/**
 * Supabase database types — TASK-003.
 *
 * Hand-written to match supabase/migrations/20260325000001_initial_schema.sql.
 * After pushing the schema to Supabase, regenerate with:
 *   npx supabase gen types typescript --linked > types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ----------------------------------------------------------------
// Enum mirrors
// ----------------------------------------------------------------

export type UserRoleEnum = "employee" | "manager" | "hr_admin" | "super_admin";
export type RequestStatusEnum = "draft" | "pending" | "approved" | "rejected" | "cancelled";
export type DocumentStatusEnum =
  | "pending_review" // new upload awaiting HR review (default after migration)
  | "approved"       // HR approved
  | "active"         // legacy: treated as approved in UI
  | "expired"        // document past its expiry date
  | "revoked";       // HR rejected / revoked
export type PublishStatusEnum = "draft" | "published" | "archived";
export type AnnouncementPriorityEnum = "normal" | "important" | "urgent";
export type AuditActionEnum =
  | "login"
  | "logout"
  | "create"
  | "update"
  | "delete"
  | "download"
  | "approve"
  | "reject"
  | "upload";

// ----------------------------------------------------------------
// Database interface
// ----------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      // ----------------------------------------------------------
      // departments
      // ----------------------------------------------------------
      departments: {
        Row: {
          id: string;
          name: string;
          code: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ----------------------------------------------------------
      // positions
      // ----------------------------------------------------------
      positions: {
        Row: {
          id: string;
          name: string;
          department_id: string;
          level: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          department_id: string;
          level?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          department_id?: string;
          level?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ----------------------------------------------------------
      // profiles
      // ----------------------------------------------------------
      profiles: {
        Row: {
          id: string;
          employee_id: string | null;
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          role: UserRoleEnum;
          department_id: string | null;
          position_id: string | null;
          manager_id: string | null;
          hire_date: string | null;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          employee_id?: string | null;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string | null;
          role?: UserRoleEnum;
          department_id?: string | null;
          position_id?: string | null;
          manager_id?: string | null;
          hire_date?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string | null;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string | null;
          role?: UserRoleEnum;
          department_id?: string | null;
          position_id?: string | null;
          manager_id?: string | null;
          hire_date?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ----------------------------------------------------------
      // request_types
      // ----------------------------------------------------------
      request_types: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          requires_approval: boolean;
          is_active: boolean;
          metadata_schema: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          description?: string | null;
          requires_approval?: boolean;
          is_active?: boolean;
          metadata_schema?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          description?: string | null;
          requires_approval?: boolean;
          is_active?: boolean;
          metadata_schema?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ----------------------------------------------------------
      // requests
      // ----------------------------------------------------------
      requests: {
        Row: {
          id: string;
          request_type_id: string;
          employee_id: string;
          reviewer_id: string | null;
          status: RequestStatusEnum;
          metadata: Json;
          notes: string | null;
          reviewer_notes: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          request_type_id: string;
          employee_id: string;
          reviewer_id?: string | null;
          status?: RequestStatusEnum;
          metadata?: Json;
          notes?: string | null;
          reviewer_notes?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          request_type_id?: string;
          employee_id?: string;
          reviewer_id?: string | null;
          status?: RequestStatusEnum;
          metadata?: Json;
          notes?: string | null;
          reviewer_notes?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ----------------------------------------------------------
      // request_attachments
      // ----------------------------------------------------------
      request_attachments: {
        Row: {
          id: string;
          request_id: string;
          uploaded_by: string;
          file_name: string;
          file_type: string;
          file_size: number;
          storage_path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          uploaded_by: string;
          file_name: string;
          file_type: string;
          file_size: number;
          storage_path: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          uploaded_by?: string;
          file_name?: string;
          file_type?: string;
          file_size?: number;
          storage_path?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      // ----------------------------------------------------------
      // payroll_receipts
      // ----------------------------------------------------------
      payroll_receipts: {
        Row: {
          id: string;
          employee_id: string;
          period: string;
          period_type: string;
          gross_amount: number;
          net_amount: number;
          concepts: Json;
          storage_path: string;
          issued_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          period: string;
          period_type?: string;
          gross_amount: number;
          net_amount: number;
          concepts?: Json;
          storage_path: string;
          issued_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          period?: string;
          period_type?: string;
          gross_amount?: number;
          net_amount?: number;
          concepts?: Json;
          storage_path?: string;
          issued_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ----------------------------------------------------------
      // employee_documents
      // ----------------------------------------------------------
      employee_documents: {
        Row: {
          id: string;
          employee_id: string;
          uploaded_by: string;
          category: string;
          name: string;
          description: string | null;
          file_name: string;
          file_type: string;
          file_size: number;
          storage_path: string;
          status: DocumentStatusEnum;
          reviewer_id: string | null;
          reviewer_notes: string | null;
          reviewed_at: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          uploaded_by: string;
          category: string;
          name: string;
          description?: string | null;
          file_name: string;
          file_type: string;
          file_size: number;
          storage_path: string;
          status?: DocumentStatusEnum;
          reviewer_id?: string | null;
          reviewer_notes?: string | null;
          reviewed_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          uploaded_by?: string;
          category?: string;
          name?: string;
          description?: string | null;
          file_name?: string;
          file_type?: string;
          file_size?: number;
          storage_path?: string;
          status?: DocumentStatusEnum;
          reviewer_id?: string | null;
          reviewer_notes?: string | null;
          reviewed_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ----------------------------------------------------------
      // announcements
      // ----------------------------------------------------------
      announcements: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          body: string;
          category: string;
          target_roles: UserRoleEnum[];
          featured_image_url: string | null;
          featured_image_alt: string | null;
          media: Json | null;
          priority: AnnouncementPriorityEnum | null;
          status: PublishStatusEnum;
          pinned: boolean;
          published_at: string | null;
          expires_at: string | null;
          featured_image_url: string | null;
          featured_image_alt: string | null;
          media: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          title: string;
          body: string;
          category?: string;
          target_roles?: UserRoleEnum[];
          featured_image_url?: string | null;
          featured_image_alt?: string | null;
          media?: Json | null;
          priority?: AnnouncementPriorityEnum | null;
          status?: PublishStatusEnum;
          pinned?: boolean;
          published_at?: string | null;
          expires_at?: string | null;
          featured_image_url?: string | null;
          featured_image_alt?: string | null;
          media?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          title?: string;
          body?: string;
          category?: string;
          target_roles?: UserRoleEnum[];
          featured_image_url?: string | null;
          featured_image_alt?: string | null;
          media?: Json | null;
          priority?: AnnouncementPriorityEnum | null;
          status?: PublishStatusEnum;
          pinned?: boolean;
          published_at?: string | null;
          expires_at?: string | null;
          featured_image_url?: string | null;
          featured_image_alt?: string | null;
          media?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ----------------------------------------------------------
      // policies
      // ----------------------------------------------------------
      policies: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          description: string | null;
          category: string;
          version: string;
          file_name: string | null;
          file_type: string | null;
          file_size: number | null;
          storage_path: string | null;
          status: PublishStatusEnum;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          title: string;
          description?: string | null;
          category: string;
          version?: string;
          file_name?: string | null;
          file_type?: string | null;
          file_size?: number | null;
          storage_path?: string | null;
          status?: PublishStatusEnum;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          title?: string;
          description?: string | null;
          category?: string;
          version?: string;
          file_name?: string | null;
          file_type?: string | null;
          file_size?: number | null;
          storage_path?: string | null;
          status?: PublishStatusEnum;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ----------------------------------------------------------
      // audit_logs
      // ----------------------------------------------------------
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: AuditActionEnum;
          resource: string;
          resource_id: string | null;
          metadata: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: AuditActionEnum;
          resource: string;
          resource_id?: string | null;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          action?: AuditActionEnum;
          resource?: string;
          resource_id?: string | null;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };

    Views: Record<string, never>;

    Functions: Record<string, never>;

    Enums: {
      user_role: UserRoleEnum;
      request_status: RequestStatusEnum;
      document_status: DocumentStatusEnum;
      publish_status: PublishStatusEnum;
      audit_action: AuditActionEnum;
    };
  };
}
