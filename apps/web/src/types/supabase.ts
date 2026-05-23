export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_suggestion_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string
          ai_suggestion_id: string
          created_at: string
          details: Json
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type: string
          ai_suggestion_id: string
          created_at?: string
          details?: Json
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string
          ai_suggestion_id?: string
          created_at?: string
          details?: Json
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_suggestion_audit_logs_ai_suggestion_id_fkey"
            columns: ["ai_suggestion_id"]
            isOneToOne: false
            referencedRelation: "ai_suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_suggestions: {
        Row: {
          applied_at: string | null
          created_at: string
          id: string
          organization_id: string
          output_payload: Json
          project_id: string | null
          prompt_snapshot: string
          proposed_by: string
          source_entity_id: string
          source_entity_type: string
          status: string
          suggestion_kind: string
          title: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          id?: string
          organization_id: string
          output_payload?: Json
          project_id?: string | null
          prompt_snapshot: string
          proposed_by?: string
          source_entity_id: string
          source_entity_type: string
          status?: string
          suggestion_kind: string
          title: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          output_payload?: Json
          project_id?: string | null
          prompt_snapshot?: string
          proposed_by?: string
          source_entity_id?: string
          source_entity_type?: string
          status?: string
          suggestion_kind?: string
          title?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_suggestions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_suggestions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action_type: Database["public"]["Enums"]["audit_action_type"]
          actor_user_id: string
          created_at: string
          details: Json
          entity_id: string
          entity_type: string
          id: string
          organization_id: string
        }
        Insert: {
          action_type: Database["public"]["Enums"]["audit_action_type"]
          actor_user_id: string
          created_at?: string
          details?: Json
          entity_id: string
          entity_type: string
          id?: string
          organization_id: string
        }
        Update: {
          action_type?: Database["public"]["Enums"]["audit_action_type"]
          actor_user_id?: string
          created_at?: string
          details?: Json
          entity_id?: string
          entity_type?: string
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_feedback_threads: {
        Row: {
          author_role: string
          client_organization_id: string
          created_at: string
          id: string
          message: string
          organization_id: string
          project_id: string | null
          related_entity_id: string
          related_entity_type: string
        }
        Insert: {
          author_role: string
          client_organization_id: string
          created_at?: string
          id?: string
          message: string
          organization_id: string
          project_id?: string | null
          related_entity_id: string
          related_entity_type: string
        }
        Update: {
          author_role?: string
          client_organization_id?: string
          created_at?: string
          id?: string
          message?: string
          organization_id?: string
          project_id?: string | null
          related_entity_id?: string
          related_entity_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_feedback_threads_client_organization_id_fkey"
            columns: ["client_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_feedback_threads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_feedback_threads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      client_portal_accesses: {
        Row: {
          access_scope: string
          client_organization_id: string
          created_at: string
          id: string
          is_active: boolean
          organization_id: string
          project_id: string | null
        }
        Insert: {
          access_scope: string
          client_organization_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id: string
          project_id?: string | null
        }
        Update: {
          access_scope?: string
          client_organization_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_portal_accesses_client_organization_id_fkey"
            columns: ["client_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_portal_accesses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_portal_accesses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      consulting_hours: {
        Row: {
          activity_type: string | null
          billable_hours: number
          consulting_mission_id: string
          created_at: string
          expert_profile_id: string | null
          hours_spent: number
          id: string
          notes: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          updated_at: string
          work_date: string
        }
        Insert: {
          activity_type?: string | null
          billable_hours: number
          consulting_mission_id: string
          created_at?: string
          expert_profile_id?: string | null
          hours_spent: number
          id?: string
          notes?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          updated_at?: string
          work_date: string
        }
        Update: {
          activity_type?: string | null
          billable_hours?: number
          consulting_mission_id?: string
          created_at?: string
          expert_profile_id?: string | null
          hours_spent?: number
          id?: string
          notes?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          updated_at?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "consulting_hours_consulting_mission_id_fkey"
            columns: ["consulting_mission_id"]
            isOneToOne: false
            referencedRelation: "consulting_mission_capacity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consulting_hours_consulting_mission_id_fkey"
            columns: ["consulting_mission_id"]
            isOneToOne: false
            referencedRelation: "consulting_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consulting_hours_expert_profile_id_fkey"
            columns: ["expert_profile_id"]
            isOneToOne: false
            referencedRelation: "expert_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consulting_missions: {
        Row: {
          billing_mode: Database["public"]["Enums"]["mission_billing_mode"]
          completed_at: string | null
          consumed_hours: number
          created_at: string
          currency_code: string
          description: string | null
          due_at: string | null
          expert_request_id: string | null
          fixed_fee_cents: number | null
          hourly_rate_cents: number | null
          id: string
          lead_expert_id: string | null
          mission_number: string | null
          organization_id: string
          related_entity_id: string | null
          related_entity_type: string | null
          sold_hours: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["consulting_mission_status"]
          title: string
          updated_at: string
        }
        Insert: {
          billing_mode?: Database["public"]["Enums"]["mission_billing_mode"]
          completed_at?: string | null
          consumed_hours?: number
          created_at?: string
          currency_code?: string
          description?: string | null
          due_at?: string | null
          expert_request_id?: string | null
          fixed_fee_cents?: number | null
          hourly_rate_cents?: number | null
          id?: string
          lead_expert_id?: string | null
          mission_number?: string | null
          organization_id: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          sold_hours?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["consulting_mission_status"]
          title: string
          updated_at?: string
        }
        Update: {
          billing_mode?: Database["public"]["Enums"]["mission_billing_mode"]
          completed_at?: string | null
          consumed_hours?: number
          created_at?: string
          currency_code?: string
          description?: string | null
          due_at?: string | null
          expert_request_id?: string | null
          fixed_fee_cents?: number | null
          hourly_rate_cents?: number | null
          id?: string
          lead_expert_id?: string | null
          mission_number?: string | null
          organization_id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          sold_hours?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["consulting_mission_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consulting_missions_expert_request_id_fkey"
            columns: ["expert_request_id"]
            isOneToOne: false
            referencedRelation: "expert_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consulting_missions_lead_expert_id_fkey"
            columns: ["lead_expert_id"]
            isOneToOne: false
            referencedRelation: "expert_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consulting_missions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          body_template: string
          code: string
          created_at: string
          created_by: string
          id: string
          letterhead_name: string | null
          logo_url: string | null
          name: string
          organization_id: string
          signature_label: string | null
          stamp_label: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          body_template: string
          code: string
          created_at?: string
          created_by: string
          id?: string
          letterhead_name?: string | null
          logo_url?: string | null
          name: string
          organization_id: string
          signature_label?: string | null
          stamp_label?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          body_template?: string
          code?: string
          created_at?: string
          created_by?: string
          id?: string
          letterhead_name?: string | null
          logo_url?: string | null
          name?: string
          organization_id?: string
          signature_label?: string | null
          stamp_label?: string | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          body_rendered: string
          created_at: string
          created_by: string
          id: string
          metadata: Json
          organization_id: string
          project_id: string | null
          status: Database["public"]["Enums"]["document_status"]
          subject: string | null
          template_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body_rendered: string
          created_at?: string
          created_by: string
          id?: string
          metadata?: Json
          organization_id: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          subject?: string | null
          template_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body_rendered?: string
          created_at?: string
          created_by?: string
          id?: string
          metadata?: Json
          organization_id?: string
          project_id?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          subject?: string | null
          template_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      emails: {
        Row: {
          body_text: string
          classification: Database["public"]["Enums"]["email_classification"]
          created_at: string
          external_message_id: string | null
          id: string
          mailbox_id: string
          organization_id: string
          project_id: string | null
          received_at: string
          related_task_id: string | null
          sender_email: string
          sender_name: string | null
          subject: string
          updated_at: string
        }
        Insert: {
          body_text: string
          classification?: Database["public"]["Enums"]["email_classification"]
          created_at?: string
          external_message_id?: string | null
          id?: string
          mailbox_id: string
          organization_id: string
          project_id?: string | null
          received_at?: string
          related_task_id?: string | null
          sender_email: string
          sender_name?: string | null
          subject: string
          updated_at?: string
        }
        Update: {
          body_text?: string
          classification?: Database["public"]["Enums"]["email_classification"]
          created_at?: string
          external_message_id?: string | null
          id?: string
          mailbox_id?: string
          organization_id?: string
          project_id?: string | null
          received_at?: string
          related_task_id?: string | null
          sender_email?: string
          sender_name?: string | null
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emails_mailbox_id_fkey"
            columns: ["mailbox_id"]
            isOneToOne: false
            referencedRelation: "mailboxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_profiles: {
        Row: {
          bio: string | null
          created_at: string
          credentials: string[]
          currency_code: string
          full_name: string
          headline: string | null
          hourly_rate_cents: number | null
          id: string
          internal_expert: boolean
          is_active: boolean
          organization_id: string | null
          role: Database["public"]["Enums"]["expert_role"]
          seniority_years: number | null
          slug: string | null
          specialties: string[]
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          credentials?: string[]
          currency_code?: string
          full_name: string
          headline?: string | null
          hourly_rate_cents?: number | null
          id?: string
          internal_expert?: boolean
          is_active?: boolean
          organization_id?: string | null
          role: Database["public"]["Enums"]["expert_role"]
          seniority_years?: number | null
          slug?: string | null
          specialties?: string[]
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          credentials?: string[]
          currency_code?: string
          full_name?: string
          headline?: string | null
          hourly_rate_cents?: number | null
          id?: string
          internal_expert?: boolean
          is_active?: boolean
          organization_id?: string | null
          role?: Database["public"]["Enums"]["expert_role"]
          seniority_years?: number | null
          slug?: string | null
          specialties?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_requests: {
        Row: {
          assigned_expert_id: string | null
          closed_at: string | null
          company_name: string | null
          created_at: string
          delivery_mode: Database["public"]["Enums"]["delivery_mode"]
          description: string | null
          id: string
          intake_channel: string | null
          organization_id: string
          priority: number
          qualified_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          request_number: string | null
          request_type: Database["public"]["Enums"]["expert_request_type"]
          requested_by_email: string | null
          requested_by_name: string | null
          requested_due_at: string | null
          status: Database["public"]["Enums"]["expert_request_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_expert_id?: string | null
          closed_at?: string | null
          company_name?: string | null
          created_at?: string
          delivery_mode?: Database["public"]["Enums"]["delivery_mode"]
          description?: string | null
          id?: string
          intake_channel?: string | null
          organization_id: string
          priority?: number
          qualified_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          request_number?: string | null
          request_type: Database["public"]["Enums"]["expert_request_type"]
          requested_by_email?: string | null
          requested_by_name?: string | null
          requested_due_at?: string | null
          status?: Database["public"]["Enums"]["expert_request_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_expert_id?: string | null
          closed_at?: string | null
          company_name?: string | null
          created_at?: string
          delivery_mode?: Database["public"]["Enums"]["delivery_mode"]
          description?: string | null
          id?: string
          intake_channel?: string | null
          organization_id?: string
          priority?: number
          qualified_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          request_number?: string | null
          request_type?: Database["public"]["Enums"]["expert_request_type"]
          requested_by_email?: string | null
          requested_by_name?: string | null
          requested_due_at?: string | null
          status?: Database["public"]["Enums"]["expert_request_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_requests_assigned_expert_id_fkey"
            columns: ["assigned_expert_id"]
            isOneToOne: false
            referencedRelation: "expert_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expert_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mailboxes: {
        Row: {
          address: string
          created_at: string
          created_by: string
          display_name: string
          id: string
          is_active: boolean
          organization_id: string
          provider: Database["public"]["Enums"]["mailbox_provider"]
          provider_config: Json
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          created_by: string
          display_name: string
          id?: string
          is_active?: boolean
          organization_id: string
          provider?: Database["public"]["Enums"]["mailbox_provider"]
          provider_config?: Json
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          created_by?: string
          display_name?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          provider?: Database["public"]["Enums"]["mailbox_provider"]
          provider_config?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mailboxes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      odoo_mappings: {
        Row: {
          adminbtp_entity_id: string
          binding_type: Database["public"]["Enums"]["odoo_binding_type"]
          created_at: string
          created_by: string
          id: string
          odoo_model: string
          odoo_record_id: string
          organization_id: string
          sync_status: string
          updated_at: string
        }
        Insert: {
          adminbtp_entity_id: string
          binding_type: Database["public"]["Enums"]["odoo_binding_type"]
          created_at?: string
          created_by: string
          id?: string
          odoo_model: string
          odoo_record_id: string
          organization_id: string
          sync_status?: string
          updated_at?: string
        }
        Update: {
          adminbtp_entity_id?: string
          binding_type?: Database["public"]["Enums"]["odoo_binding_type"]
          created_at?: string
          created_by?: string
          id?: string
          odoo_model?: string
          odoo_record_id?: string
          organization_id?: string
          sync_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "odoo_mappings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          joined_at: string
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          organization_id: string
          role?: Database["public"]["Enums"]["organization_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["organization_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          legal_name: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          legal_name?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          legal_name?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_followups: {
        Row: {
          created_at: string
          days_after_due: number
          id: string
          organization_id: string
          scheduled_for: string
          situation_id: string
          status: Database["public"]["Enums"]["followup_status"]
          step_label: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          days_after_due: number
          id?: string
          organization_id: string
          scheduled_for: string
          situation_id: string
          status?: Database["public"]["Enums"]["followup_status"]
          step_label: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          days_after_due?: number
          id?: string
          organization_id?: string
          scheduled_for?: string
          situation_id?: string
          status?: Database["public"]["Enums"]["followup_status"]
          step_label?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_followups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_followups_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: false
            referencedRelation: "situations"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_alerts: {
        Row: {
          created_at: string
          id: string
          is_resolved: boolean
          message: string
          phase_id: string
          resolved_at: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_resolved?: boolean
          message: string
          phase_id: string
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_resolved?: boolean
          message?: string
          phase_id?: string
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phase_alerts_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_checklist_items: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          is_required: boolean
          label: string
          phase_id: string
          sequence_number: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          is_required?: boolean
          label: string
          phase_id: string
          sequence_number?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          is_required?: boolean
          label?: string
          phase_id?: string
          sequence_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phase_checklist_items_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      project_organizations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_lead: boolean
          joined_at: string
          organization_id: string
          project_id: string
          role: Database["public"]["Enums"]["project_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_lead?: boolean
          joined_at?: string
          organization_id: string
          project_id: string
          role: Database["public"]["Enums"]["project_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_lead?: boolean
          joined_at?: string
          organization_id?: string
          project_id?: string
          role?: Database["public"]["Enums"]["project_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_organizations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_phase_templates: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          profile: Database["public"]["Enums"]["phase_profile"]
          sequence_number: number
          title: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          profile: Database["public"]["Enums"]["phase_profile"]
          sequence_number: number
          title: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          profile?: Database["public"]["Enums"]["phase_profile"]
          sequence_number?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_phases: {
        Row: {
          completed_at: string | null
          created_at: string
          due_at: string | null
          id: string
          profile: Database["public"]["Enums"]["phase_profile"]
          project_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["phase_status"]
          template_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          profile: Database["public"]["Enums"]["phase_profile"]
          project_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["phase_status"]
          template_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          profile?: Database["public"]["Enums"]["phase_profile"]
          project_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["phase_status"]
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_phases_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "project_phase_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          code: string
          created_at: string
          created_by: string
          description: string | null
          ends_on: string | null
          id: string
          name: string
          owner_organization_id: string
          slug: string
          starts_on: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          description?: string | null
          ends_on?: string | null
          id?: string
          name: string
          owner_organization_id: string
          slug: string
          starts_on?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          description?: string | null
          ends_on?: string | null
          id?: string
          name?: string
          owner_organization_id?: string
          slug?: string
          starts_on?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_organization_id_fkey"
            columns: ["owner_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      signature_profiles: {
        Row: {
          created_at: string
          created_by: string
          id: string
          label: string
          organization_id: string
          signature_style: string
          signer_name: string
          signer_role: string
          updated_at: string
          whatsapp_enabled: boolean
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          label: string
          organization_id: string
          signature_style?: string
          signer_name: string
          signer_role: string
          updated_at?: string
          whatsapp_enabled?: boolean
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          label?: string
          organization_id?: string
          signature_style?: string
          signer_name?: string
          signer_role?: string
          updated_at?: string
          whatsapp_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "signature_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      signature_requests: {
        Row: {
          approver_id: string | null
          created_at: string
          document_id: string
          id: string
          organization_id: string
          requested_by: string
          signature_profile_id: string | null
          status: Database["public"]["Enums"]["signature_request_status"]
          updated_at: string
          validation_notes: string | null
          whatsapp_payload: Json
        }
        Insert: {
          approver_id?: string | null
          created_at?: string
          document_id: string
          id?: string
          organization_id: string
          requested_by: string
          signature_profile_id?: string | null
          status?: Database["public"]["Enums"]["signature_request_status"]
          updated_at?: string
          validation_notes?: string | null
          whatsapp_payload?: Json
        }
        Update: {
          approver_id?: string | null
          created_at?: string
          document_id?: string
          id?: string
          organization_id?: string
          requested_by?: string
          signature_profile_id?: string | null
          status?: Database["public"]["Enums"]["signature_request_status"]
          updated_at?: string
          validation_notes?: string | null
          whatsapp_payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "signature_requests_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signature_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signature_requests_signature_profile_id_fkey"
            columns: ["signature_profile_id"]
            isOneToOne: false
            referencedRelation: "signature_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      situations: {
        Row: {
          amount_cents: number
          created_at: string
          created_by: string
          currency_code: string
          customer_name: string
          due_on: string
          id: string
          issued_on: string
          organization_id: string
          project_id: string | null
          reference: string
          status: Database["public"]["Enums"]["situation_status"]
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          created_by: string
          currency_code?: string
          customer_name: string
          due_on: string
          id?: string
          issued_on: string
          organization_id: string
          project_id?: string | null
          reference: string
          status?: Database["public"]["Enums"]["situation_status"]
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          created_by?: string
          currency_code?: string
          customer_name?: string
          due_on?: string
          id?: string
          issued_on?: string
          organization_id?: string
          project_id?: string | null
          reference?: string
          status?: Database["public"]["Enums"]["situation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "situations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "situations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      technical_reviews: {
        Row: {
          consulting_mission_id: string | null
          created_at: string
          delivered_at: string | null
          delivery_mode: Database["public"]["Enums"]["delivery_mode"]
          expert_request_id: string | null
          findings: string | null
          id: string
          organization_id: string
          recommendations: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          review_number: string | null
          review_type: Database["public"]["Enums"]["review_type"]
          reviewed_at: string | null
          reviewer_expert_id: string | null
          source_document_id: string | null
          source_document_type: string | null
          status: Database["public"]["Enums"]["review_status"]
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          consulting_mission_id?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_mode?: Database["public"]["Enums"]["delivery_mode"]
          expert_request_id?: string | null
          findings?: string | null
          id?: string
          organization_id: string
          recommendations?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          review_number?: string | null
          review_type: Database["public"]["Enums"]["review_type"]
          reviewed_at?: string | null
          reviewer_expert_id?: string | null
          source_document_id?: string | null
          source_document_type?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          consulting_mission_id?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_mode?: Database["public"]["Enums"]["delivery_mode"]
          expert_request_id?: string | null
          findings?: string | null
          id?: string
          organization_id?: string
          recommendations?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          review_number?: string | null
          review_type?: Database["public"]["Enums"]["review_type"]
          reviewed_at?: string | null
          reviewer_expert_id?: string | null
          source_document_id?: string | null
          source_document_type?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "technical_reviews_consulting_mission_id_fkey"
            columns: ["consulting_mission_id"]
            isOneToOne: false
            referencedRelation: "consulting_mission_capacity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technical_reviews_consulting_mission_id_fkey"
            columns: ["consulting_mission_id"]
            isOneToOne: false
            referencedRelation: "consulting_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technical_reviews_expert_request_id_fkey"
            columns: ["expert_request_id"]
            isOneToOne: false
            referencedRelation: "expert_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technical_reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technical_reviews_reviewer_expert_id_fkey"
            columns: ["reviewer_expert_id"]
            isOneToOne: false
            referencedRelation: "expert_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          default_organization_id: string | null
          email: string | null
          full_name: string | null
          id: string
          internal_role: Database["public"]["Enums"]["internal_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_organization_id?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          internal_role?: Database["public"]["Enums"]["internal_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_organization_id?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          internal_role?: Database["public"]["Enums"]["internal_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_default_organization_id_fkey"
            columns: ["default_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      consulting_mission_capacity: {
        Row: {
          billing_mode:
            | Database["public"]["Enums"]["mission_billing_mode"]
            | null
          consumed_hours: number | null
          id: string | null
          logged_billable_hours: number | null
          logged_hours: number | null
          mission_number: string | null
          organization_id: string | null
          remaining_billable_hours: number | null
          sold_hours: number | null
          status:
            | Database["public"]["Enums"]["consulting_mission_status"]
            | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consulting_missions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_access_project: {
        Args: { target_project_id: string }
        Returns: boolean
      }
      can_complete_phase: {
        Args: { target_phase_id: string }
        Returns: boolean
      }
      create_organization_with_owner: {
        Args: {
          target_legal_name?: string | null
          target_name: string
          target_slug: string
        }
        Returns: string
      }
      create_project_with_owner_role: {
        Args: {
          target_code: string
          target_description?: string | null
          target_ends_on?: string | null
          target_name: string
          target_owner_organization_id: string
          target_role?:
            | Database["public"]["Enums"]["project_role"]
            | null
          target_slug: string
          target_starts_on?: string | null
          target_status?:
            | Database["public"]["Enums"]["project_status"]
            | null
        }
        Returns: string
      }
      can_manage_project: {
        Args: { target_project_id: string }
        Returns: boolean
      }
      is_org_manager: { Args: { target_org_id: string }; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      alert_severity: "low" | "medium" | "high"
      audit_action_type:
        | "created"
        | "submitted"
        | "approved"
        | "rejected"
        | "signature_requested"
        | "whatsapp_prepared"
      consulting_mission_status:
        | "draft"
        | "quoted"
        | "approved"
        | "scheduled"
        | "in_progress"
        | "on_hold"
        | "completed"
        | "cancelled"
        | "invoiced"
      delivery_mode: "human" | "ai" | "hybrid"
      document_status: "draft" | "generated" | "validated" | "archived"
      email_classification:
        | "unclassified"
        | "document"
        | "payment_followup"
        | "task"
        | "client_message"
        | "validation"
      expert_request_status:
        | "draft"
        | "submitted"
        | "qualified"
        | "assigned"
        | "in_progress"
        | "waiting_for_documents"
        | "waiting_for_client"
        | "completed"
        | "cancelled"
      expert_request_type:
        | "technical_question"
        | "document_analysis"
        | "methodology_review"
        | "doe_review"
        | "exe_review"
        | "ppsps_review"
        | "tender_support"
        | "regulatory_support"
        | "architectural_support"
        | "project_management_support"
        | "tce_support"
        | "moa_support"
        | "other"
      expert_role:
        | "btp_engineer"
        | "architect_hmonp"
        | "regulatory_consultant"
        | "project_management_consultant"
        | "tce_support"
        | "moa_support"
        | "other"
      followup_status: "scheduled" | "sent" | "done" | "cancelled"
      internal_role:
        | "platform_admin"
        | "operations_manager"
        | "support_agent"
        | "expert_consultant"
        | "member"
      mailbox_provider: "internal" | "gmail" | "outlook"
      mission_billing_mode:
        | "hourly"
        | "fixed_fee"
        | "retainer"
        | "included_in_plan"
        | "not_billable"
      odoo_binding_type:
        | "customer"
        | "invoice"
        | "subscription"
        | "consulting_service"
      organization_role: "org_owner" | "org_admin" | "org_member" | "org_viewer"
      phase_profile: "moe" | "moa" | "tce" | "trade_contractor"
      phase_status:
        | "not_started"
        | "in_progress"
        | "blocked"
        | "ready_for_review"
        | "completed"
      project_role:
        | "moa"
        | "moe"
        | "tce"
        | "bet"
        | "opc"
        | "amo"
        | "trade_contractor"
        | "subcontractor"
      project_status: "draft" | "active" | "on_hold" | "completed" | "cancelled"
      review_status:
        | "draft"
        | "in_progress"
        | "ready_for_validation"
        | "validated"
        | "sent"
        | "archived"
      review_type:
        | "technical_review"
        | "document_review"
        | "doe_review"
        | "exe_review"
        | "ppsps_review"
        | "regulatory_review"
        | "architectural_review"
        | "coordination_review"
        | "compliance_review"
        | "other"
      signature_request_status:
        | "draft"
        | "pending_internal_validation"
        | "pending_signature"
        | "approved"
        | "rejected"
        | "cancelled"
      situation_status:
        | "draft"
        | "sent"
        | "partially_paid"
        | "paid"
        | "disputed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type SupabaseDatabase = Database

export type SupabaseSchemaName = "public"

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      alert_severity: ["low", "medium", "high"],
      audit_action_type: [
        "created",
        "submitted",
        "approved",
        "rejected",
        "signature_requested",
        "whatsapp_prepared",
      ],
      consulting_mission_status: [
        "draft",
        "quoted",
        "approved",
        "scheduled",
        "in_progress",
        "on_hold",
        "completed",
        "cancelled",
        "invoiced",
      ],
      delivery_mode: ["human", "ai", "hybrid"],
      document_status: ["draft", "generated", "validated", "archived"],
      email_classification: [
        "unclassified",
        "document",
        "payment_followup",
        "task",
        "client_message",
        "validation",
      ],
      expert_request_status: [
        "draft",
        "submitted",
        "qualified",
        "assigned",
        "in_progress",
        "waiting_for_documents",
        "waiting_for_client",
        "completed",
        "cancelled",
      ],
      expert_request_type: [
        "technical_question",
        "document_analysis",
        "methodology_review",
        "doe_review",
        "exe_review",
        "ppsps_review",
        "tender_support",
        "regulatory_support",
        "architectural_support",
        "project_management_support",
        "tce_support",
        "moa_support",
        "other",
      ],
      expert_role: [
        "btp_engineer",
        "architect_hmonp",
        "regulatory_consultant",
        "project_management_consultant",
        "tce_support",
        "moa_support",
        "other",
      ],
      followup_status: ["scheduled", "sent", "done", "cancelled"],
      internal_role: [
        "platform_admin",
        "operations_manager",
        "support_agent",
        "expert_consultant",
        "member",
      ],
      mailbox_provider: ["internal", "gmail", "outlook"],
      mission_billing_mode: [
        "hourly",
        "fixed_fee",
        "retainer",
        "included_in_plan",
        "not_billable",
      ],
      odoo_binding_type: [
        "customer",
        "invoice",
        "subscription",
        "consulting_service",
      ],
      organization_role: ["org_owner", "org_admin", "org_member", "org_viewer"],
      phase_profile: ["moe", "moa", "tce", "trade_contractor"],
      phase_status: [
        "not_started",
        "in_progress",
        "blocked",
        "ready_for_review",
        "completed",
      ],
      project_role: [
        "moa",
        "moe",
        "tce",
        "bet",
        "opc",
        "amo",
        "trade_contractor",
        "subcontractor",
      ],
      project_status: ["draft", "active", "on_hold", "completed", "cancelled"],
      review_status: [
        "draft",
        "in_progress",
        "ready_for_validation",
        "validated",
        "sent",
        "archived",
      ],
      review_type: [
        "technical_review",
        "document_review",
        "doe_review",
        "exe_review",
        "ppsps_review",
        "regulatory_review",
        "architectural_review",
        "coordination_review",
        "compliance_review",
        "other",
      ],
      signature_request_status: [
        "draft",
        "pending_internal_validation",
        "pending_signature",
        "approved",
        "rejected",
        "cancelled",
      ],
      situation_status: ["draft", "sent", "partially_paid", "paid", "disputed"],
    },
  },
} as const
