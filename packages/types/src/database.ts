// Généré depuis le schéma Supabase réel (projet "AdminBTP", ref azphgxzapyuazxtqzvta) via
// mcp__supabase__generate_typescript_types le 2026-10-21. Ne pas éditer à la main : régénérer
// après toute migration dans database/migrations/ pour garder ce fichier synchronisé.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string;
          actor_type: Database["public"]["Enums"]["audit_actor_type"];
          actor_user_id: string | null;
          created_at: string;
          id: string;
          metadata: Json;
          organization_id: string;
          target_id: string;
          target_type: string;
        };
        Insert: {
          action: string;
          actor_type: Database["public"]["Enums"]["audit_actor_type"];
          actor_user_id?: string | null;
          created_at?: string;
          id?: string;
          metadata?: Json;
          organization_id: string;
          target_id: string;
          target_type: string;
        };
        Update: {
          action?: string;
          actor_type?: Database["public"]["Enums"]["audit_actor_type"];
          actor_user_id?: string | null;
          created_at?: string;
          id?: string;
          metadata?: Json;
          organization_id?: string;
          target_id?: string;
          target_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_user_id_fkey";
            columns: ["actor_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_log_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      document_templates: {
        Row: {
          category: Database["public"]["Enums"]["document_category"];
          created_at: string;
          file_url: string;
          id: string;
          name: string;
          organization_id: string;
          requires_expert_review: boolean;
          variables: string[];
          version: number;
        };
        Insert: {
          category: Database["public"]["Enums"]["document_category"];
          created_at?: string;
          file_url: string;
          id?: string;
          name: string;
          organization_id: string;
          requires_expert_review?: boolean;
          variables?: string[];
          version?: number;
        };
        Update: {
          category?: Database["public"]["Enums"]["document_category"];
          created_at?: string;
          file_url?: string;
          id?: string;
          name?: string;
          organization_id?: string;
          requires_expert_review?: boolean;
          variables?: string[];
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "document_templates_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          category: Database["public"]["Enums"]["document_category"];
          created_at: string;
          created_by_user_id: string;
          file_url: string;
          id: string;
          organization_id: string;
          site_id: string | null;
          status: Database["public"]["Enums"]["document_status"];
          template_id: string | null;
          title: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          category: Database["public"]["Enums"]["document_category"];
          created_at?: string;
          created_by_user_id: string;
          file_url: string;
          id?: string;
          organization_id: string;
          site_id?: string | null;
          status: Database["public"]["Enums"]["document_status"];
          template_id?: string | null;
          title: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          category?: Database["public"]["Enums"]["document_category"];
          created_at?: string;
          created_by_user_id?: string;
          file_url?: string;
          id?: string;
          organization_id?: string;
          site_id?: string | null;
          status?: Database["public"]["Enums"]["document_status"];
          template_id?: string | null;
          title?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "documents_created_by_user_id_fkey";
            columns: ["created_by_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "document_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      expertise_requests: {
        Row: {
          assigned_expert_user_id: string | null;
          attached_document_ids: string[];
          created_at: string;
          description: string;
          hours_spent: number;
          id: string;
          organization_id: string;
          requested_by_user_id: string;
          site_id: string | null;
          status: Database["public"]["Enums"]["expertise_request_status"];
          type: Database["public"]["Enums"]["expertise_request_type"];
        };
        Insert: {
          assigned_expert_user_id?: string | null;
          attached_document_ids?: string[];
          created_at?: string;
          description: string;
          hours_spent?: number;
          id?: string;
          organization_id: string;
          requested_by_user_id: string;
          site_id?: string | null;
          status: Database["public"]["Enums"]["expertise_request_status"];
          type: Database["public"]["Enums"]["expertise_request_type"];
        };
        Update: {
          assigned_expert_user_id?: string | null;
          attached_document_ids?: string[];
          created_at?: string;
          description?: string;
          hours_spent?: number;
          id?: string;
          organization_id?: string;
          requested_by_user_id?: string;
          site_id?: string | null;
          status?: Database["public"]["Enums"]["expertise_request_status"];
          type?: Database["public"]["Enums"]["expertise_request_type"];
        };
        Relationships: [
          {
            foreignKeyName: "expertise_requests_assigned_expert_user_id_fkey";
            columns: ["assigned_expert_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expertise_requests_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expertise_requests_requested_by_user_id_fkey";
            columns: ["requested_by_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expertise_requests_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      lots: {
        Row: {
          amount_ht: number | null;
          assigned_organization_id: string | null;
          id: string;
          name: string;
          number: string;
          site_id: string;
        };
        Insert: {
          amount_ht?: number | null;
          assigned_organization_id?: string | null;
          id?: string;
          name: string;
          number: string;
          site_id: string;
        };
        Update: {
          amount_ht?: number | null;
          assigned_organization_id?: string | null;
          id?: string;
          name?: string;
          number?: string;
          site_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lots_assigned_organization_id_fkey";
            columns: ["assigned_organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lots_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mail_addresses: {
        Row: {
          address: string;
          id: string;
          is_active: boolean;
          label: string;
          organization_id: string;
          site_id: string | null;
        };
        Insert: {
          address: string;
          id?: string;
          is_active?: boolean;
          label: string;
          organization_id: string;
          site_id?: string | null;
        };
        Update: {
          address?: string;
          id?: string;
          is_active?: boolean;
          label?: string;
          organization_id?: string;
          site_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mail_addresses_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mail_addresses_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mail_threads: {
        Row: {
          assigned_user_id: string | null;
          created_at: string;
          from_address: string;
          id: string;
          last_message_at: string;
          mail_address_id: string;
          organization_id: string;
          site_id: string | null;
          status: Database["public"]["Enums"]["mail_status"];
          subject: string;
          urgency: Database["public"]["Enums"]["mail_urgency"];
        };
        Insert: {
          assigned_user_id?: string | null;
          created_at?: string;
          from_address: string;
          id?: string;
          last_message_at: string;
          mail_address_id: string;
          organization_id: string;
          site_id?: string | null;
          status: Database["public"]["Enums"]["mail_status"];
          subject: string;
          urgency: Database["public"]["Enums"]["mail_urgency"];
        };
        Update: {
          assigned_user_id?: string | null;
          created_at?: string;
          from_address?: string;
          id?: string;
          last_message_at?: string;
          mail_address_id?: string;
          organization_id?: string;
          site_id?: string | null;
          status?: Database["public"]["Enums"]["mail_status"];
          subject?: string;
          urgency?: Database["public"]["Enums"]["mail_urgency"];
        };
        Relationships: [
          {
            foreignKeyName: "mail_threads_assigned_user_id_fkey";
            columns: ["assigned_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mail_threads_mail_address_id_fkey";
            columns: ["mail_address_id"];
            isOneToOne: false;
            referencedRelation: "mail_addresses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mail_threads_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mail_threads_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          address: string | null;
          city: string | null;
          country: string;
          created_at: string;
          domain: string | null;
          domain_verified: boolean;
          id: string;
          legal_name: string;
          logo_url: string | null;
          name: string;
          postal_code: string | null;
          siret: string | null;
          subscription_plan: Database["public"]["Enums"]["subscription_plan"];
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          country?: string;
          created_at?: string;
          domain?: string | null;
          domain_verified?: boolean;
          id?: string;
          legal_name: string;
          logo_url?: string | null;
          name: string;
          postal_code?: string | null;
          siret?: string | null;
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"];
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          country?: string;
          created_at?: string;
          domain?: string | null;
          domain_verified?: boolean;
          id?: string;
          legal_name?: string;
          logo_url?: string | null;
          name?: string;
          postal_code?: string | null;
          siret?: string | null;
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"];
          updated_at?: string;
        };
        Relationships: [];
      };
      phase_instances: {
        Row: {
          checklist: Json;
          depends_on_phase_instance_ids: string[];
          end_date_actual: string | null;
          end_date_target: string | null;
          expected_document_types: string[];
          id: string;
          phase_template_id: string;
          responsible_user_id: string | null;
          site_id: string;
          start_date: string | null;
          status: Database["public"]["Enums"]["phase_instance_status"];
        };
        Insert: {
          checklist?: Json;
          depends_on_phase_instance_ids?: string[];
          end_date_actual?: string | null;
          end_date_target?: string | null;
          expected_document_types?: string[];
          id?: string;
          phase_template_id: string;
          responsible_user_id?: string | null;
          site_id: string;
          start_date?: string | null;
          status: Database["public"]["Enums"]["phase_instance_status"];
        };
        Update: {
          checklist?: Json;
          depends_on_phase_instance_ids?: string[];
          end_date_actual?: string | null;
          end_date_target?: string | null;
          expected_document_types?: string[];
          id?: string;
          phase_template_id?: string;
          responsible_user_id?: string | null;
          site_id?: string;
          start_date?: string | null;
          status?: Database["public"]["Enums"]["phase_instance_status"];
        };
        Relationships: [
          {
            foreignKeyName: "phase_instances_phase_template_id_fkey";
            columns: ["phase_template_id"];
            isOneToOne: false;
            referencedRelation: "phase_templates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "phase_instances_responsible_user_id_fkey";
            columns: ["responsible_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "phase_instances_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      phase_template_sets: {
        Row: {
          id: string;
          label: string;
          mission_family: string;
          phase_template_ids: string[];
        };
        Insert: {
          id?: string;
          label: string;
          mission_family: string;
          phase_template_ids?: string[];
        };
        Update: {
          id?: string;
          label?: string;
          mission_family?: string;
          phase_template_ids?: string[];
        };
        Relationships: [];
      };
      phase_templates: {
        Row: {
          code: string;
          default_duration_days: number | null;
          description: string | null;
          id: string;
          label: string;
        };
        Insert: {
          code: string;
          default_duration_days?: number | null;
          description?: string | null;
          id?: string;
          label: string;
        };
        Update: {
          code?: string;
          default_duration_days?: number | null;
          description?: string | null;
          id?: string;
          label?: string;
        };
        Relationships: [];
      };
      portfolio_grants: {
        Row: {
          granted_at: string;
          granted_by: string;
          id: string;
          organization_id: string;
          user_id: string;
        };
        Insert: {
          granted_at?: string;
          granted_by: string;
          id?: string;
          organization_id: string;
          user_id: string;
        };
        Update: {
          granted_at?: string;
          granted_by?: string;
          id?: string;
          organization_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "portfolio_grants_granted_by_fkey";
            columns: ["granted_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "portfolio_grants_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "portfolio_grants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      reminder_rules: {
        Row: {
          applies_to_contract_type: string;
          channel: Database["public"]["Enums"]["reminder_channel"];
          days_after_due: number;
          id: string;
          site_id: string;
          template_id: string | null;
        };
        Insert: {
          applies_to_contract_type: string;
          channel: Database["public"]["Enums"]["reminder_channel"];
          days_after_due: number;
          id?: string;
          site_id: string;
          template_id?: string | null;
        };
        Update: {
          applies_to_contract_type?: string;
          channel?: Database["public"]["Enums"]["reminder_channel"];
          days_after_due?: number;
          id?: string;
          site_id?: string;
          template_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reminder_rules_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reminder_rules_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "document_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      site_access: {
        Row: {
          can_edit_documents: boolean;
          can_manage_finance: boolean;
          can_validate: boolean;
          id: string;
          site_id: string;
          user_id: string;
        };
        Insert: {
          can_edit_documents?: boolean;
          can_manage_finance?: boolean;
          can_validate?: boolean;
          id?: string;
          site_id: string;
          user_id: string;
        };
        Update: {
          can_edit_documents?: boolean;
          can_manage_finance?: boolean;
          can_validate?: boolean;
          id?: string;
          site_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "site_access_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "site_access_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      site_participants: {
        Row: {
          contract_amount_ht: number | null;
          id: string;
          joined_at: string;
          lot_id: string | null;
          mission_role: Database["public"]["Enums"]["mission_role"];
          organization_id: string;
          site_id: string;
        };
        Insert: {
          contract_amount_ht?: number | null;
          id?: string;
          joined_at?: string;
          lot_id?: string | null;
          mission_role: Database["public"]["Enums"]["mission_role"];
          organization_id: string;
          site_id: string;
        };
        Update: {
          contract_amount_ht?: number | null;
          id?: string;
          joined_at?: string;
          lot_id?: string | null;
          mission_role?: Database["public"]["Enums"]["mission_role"];
          organization_id?: string;
          site_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "site_participants_lot_id_fkey";
            columns: ["lot_id"];
            isOneToOne: false;
            referencedRelation: "lots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "site_participants_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "site_participants_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      sites: {
        Row: {
          address: string;
          budget_ht: number | null;
          city: string;
          created_at: string;
          end_date_estimated: string | null;
          id: string;
          manager_user_id: string | null;
          name: string;
          organization_id: string;
          postal_code: string | null;
          reference: string;
          start_date: string | null;
          status: Database["public"]["Enums"]["site_status"];
          updated_at: string;
        };
        Insert: {
          address: string;
          budget_ht?: number | null;
          city: string;
          created_at?: string;
          end_date_estimated?: string | null;
          id?: string;
          manager_user_id?: string | null;
          name: string;
          organization_id: string;
          postal_code?: string | null;
          reference: string;
          start_date?: string | null;
          status: Database["public"]["Enums"]["site_status"];
          updated_at?: string;
        };
        Update: {
          address?: string;
          budget_ht?: number | null;
          city?: string;
          created_at?: string;
          end_date_estimated?: string | null;
          id?: string;
          manager_user_id?: string | null;
          name?: string;
          organization_id?: string;
          postal_code?: string | null;
          reference?: string;
          start_date?: string | null;
          status?: Database["public"]["Enums"]["site_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sites_manager_user_id_fkey";
            columns: ["manager_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sites_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      situations: {
        Row: {
          amount_ht: number;
          dispute_reason: string | null;
          due_date: string | null;
          id: string;
          lot_id: string | null;
          number: number;
          paid_at: string | null;
          site_id: string;
          status: Database["public"]["Enums"]["payment_status"];
          submitted_at: string | null;
        };
        Insert: {
          amount_ht: number;
          dispute_reason?: string | null;
          due_date?: string | null;
          id?: string;
          lot_id?: string | null;
          number: number;
          paid_at?: string | null;
          site_id: string;
          status: Database["public"]["Enums"]["payment_status"];
          submitted_at?: string | null;
        };
        Update: {
          amount_ht?: number;
          dispute_reason?: string | null;
          due_date?: string | null;
          id?: string;
          lot_id?: string | null;
          number?: number;
          paid_at?: string | null;
          site_id?: string;
          status?: Database["public"]["Enums"]["payment_status"];
          submitted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "situations_lot_id_fkey";
            columns: ["lot_id"];
            isOneToOne: false;
            referencedRelation: "lots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "situations_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          assigned_user_id: string | null;
          created_at: string;
          description: string | null;
          due_date: string | null;
          id: string;
          organization_id: string;
          priority: Database["public"]["Enums"]["task_priority"];
          site_id: string | null;
          source_id: string | null;
          source_type: Database["public"]["Enums"]["task_source_type"];
          status: Database["public"]["Enums"]["task_status"];
          title: string;
        };
        Insert: {
          assigned_user_id?: string | null;
          created_at?: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          organization_id: string;
          priority: Database["public"]["Enums"]["task_priority"];
          site_id?: string | null;
          source_id?: string | null;
          source_type?: Database["public"]["Enums"]["task_source_type"];
          status: Database["public"]["Enums"]["task_status"];
          title: string;
        };
        Update: {
          assigned_user_id?: string | null;
          created_at?: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          organization_id?: string;
          priority?: Database["public"]["Enums"]["task_priority"];
          site_id?: string | null;
          source_id?: string | null;
          source_type?: Database["public"]["Enums"]["task_source_type"];
          status?: Database["public"]["Enums"]["task_status"];
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_user_id_fkey";
            columns: ["assigned_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          is_active: boolean;
          last_login_at: string | null;
          mfa_enabled: boolean;
          organization_id: string | null;
          permission_role: Database["public"]["Enums"]["user_permission_role"];
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email: string;
          full_name: string;
          id: string;
          is_active?: boolean;
          last_login_at?: string | null;
          mfa_enabled?: boolean;
          organization_id?: string | null;
          permission_role: Database["public"]["Enums"]["user_permission_role"];
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          is_active?: boolean;
          last_login_at?: string | null;
          mfa_enabled?: boolean;
          organization_id?: string | null;
          permission_role?: Database["public"]["Enums"]["user_permission_role"];
        };
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      validation_records: {
        Row: {
          comment: string | null;
          decided_at: string | null;
          decided_by_user_id: string | null;
          decision: Database["public"]["Enums"]["approval_decision"] | null;
          document_id: string;
          id: string;
          is_legally_binding_signature: boolean;
          signature_envelope_id: string | null;
          signature_provider: string | null;
          step: Database["public"]["Enums"]["validation_step"];
          whatsapp_proof_url: string | null;
        };
        Insert: {
          comment?: string | null;
          decided_at?: string | null;
          decided_by_user_id?: string | null;
          decision?: Database["public"]["Enums"]["approval_decision"] | null;
          document_id: string;
          id?: string;
          is_legally_binding_signature?: boolean;
          signature_envelope_id?: string | null;
          signature_provider?: string | null;
          step: Database["public"]["Enums"]["validation_step"];
          whatsapp_proof_url?: string | null;
        };
        Update: {
          comment?: string | null;
          decided_at?: string | null;
          decided_by_user_id?: string | null;
          decision?: Database["public"]["Enums"]["approval_decision"] | null;
          document_id?: string;
          id?: string;
          is_legally_binding_signature?: boolean;
          signature_envelope_id?: string | null;
          signature_provider?: string | null;
          step?: Database["public"]["Enums"]["validation_step"];
          whatsapp_proof_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "validation_records_decided_by_user_id_fkey";
            columns: ["decided_by_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "validation_records_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_access_organization: {
        Args: { target_org_id: string };
        Returns: boolean;
      };
      current_app_user_id: { Args: never; Returns: string };
      current_user_organization_id: { Args: never; Returns: string };
      current_user_permission_role: {
        Args: never;
        Returns: Database["public"]["Enums"]["user_permission_role"];
      };
      has_portfolio_access: {
        Args: { target_org_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      approval_decision: "APPROUVE" | "REFUSE" | "MODIFICATION_DEMANDEE";
      audit_actor_type: "USER" | "AUTOMATION" | "AI";
      document_category:
        | "COURRIER"
        | "COMPTE_RENDU"
        | "PPSPS"
        | "DC4"
        | "AGREMENT_SOUS_TRAITANT"
        | "RESERVES"
        | "SITUATION_TRAVAUX"
        | "DOE"
        | "DGD"
        | "MARCHE"
        | "ADMINISTRATIF"
        | "AUTRE";
      document_status:
        | "BROUILLON"
        | "PREEDITION"
        | "EN_CONTROLE"
        | "EN_VALIDATION"
        | "VALIDE"
        | "ENVOYE"
        | "ARCHIVE";
      expertise_request_status: "NOUVELLE" | "ASSIGNEE" | "EN_COURS" | "RAPPORT_LIVRE" | "CLOTUREE";
      expertise_request_type:
        | "AVIS_INGENIEUR"
        | "CONSULTATION_ARCHITECTE"
        | "ANALYSE_EXE"
        | "ANALYSE_DOE"
        | "RELECTURE_MEMOIRE_TECHNIQUE"
        | "ASSISTANCE_APPEL_OFFRES"
        | "AUTRE";
      mail_status: "NON_TRAITE" | "AFFECTE" | "BROUILLON_PRET" | "EN_VALIDATION" | "REPONDU" | "CLOTURE";
      mail_urgency: "NORMALE" | "URGENTE" | "CRITIQUE";
      mission_role:
        | "MOA"
        | "MOE"
        | "AMO"
        | "OPC"
        | "BET"
        | "ENTREPRISE_TCE"
        | "ENTREPRISE_GENERALE"
        | "ENTREPRISE_LOT"
        | "SOUS_TRAITANT"
        | "PROMOTEUR"
        | "BAILLEUR_SOCIAL"
        | "COLLECTIVITE";
      payment_status: "A_ETABLIR" | "TRANSMIS" | "EN_VERIFICATION" | "ACCEPTE" | "CONTESTE" | "PAYE";
      phase_instance_status:
        | "A_VENIR"
        | "EN_COURS"
        | "EN_ATTENTE_VALIDATION"
        | "VALIDEE"
        | "BLOQUEE"
        | "ANNULEE";
      reminder_channel: "EMAIL" | "WHATSAPP" | "COURRIER";
      site_status:
        | "ETUDE"
        | "CONSULTATION"
        | "PREPARATION"
        | "EN_COURS"
        | "RECEPTION"
        | "GPA"
        | "CLOTURE"
        | "SUSPENDU";
      subscription_plan: "DEMO" | "STARTER" | "PRO" | "ENTERPRISE";
      task_priority: "BASSE" | "NORMALE" | "HAUTE" | "CRITIQUE";
      task_source_type: "MANUEL" | "MAIL" | "PHASE" | "VALIDATION" | "AUTOMATISATION";
      task_status: "A_FAIRE" | "EN_COURS" | "EN_ATTENTE" | "FAIT" | "ANNULE";
      user_permission_role:
        | "ADMIN_PLATEFORME"
        | "RESPONSABLE_PORTEFEUILLE"
        | "GESTIONNAIRE_ADMINISTRATIF"
        | "CHARGE_AFFAIRES"
        | "ASSISTANT_ADMINISTRATIF"
        | "EXPERT_TECHNIQUE"
        | "VALIDATEUR"
        | "DIRIGEANT_CLIENT"
        | "COLLABORATEUR_CLIENT"
        | "OBSERVATEUR";
      validation_step:
        | "PREPARATION"
        | "CONTROLE_GESTIONNAIRE"
        | "VALIDATION_DIRIGEANT"
        | "SIGNATURE"
        | "ENVOI"
        | "ARCHIVAGE";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
