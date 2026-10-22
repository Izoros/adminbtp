export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      access_requests: {
        Row: {
          admin_decision_at: string | null
          admin_decision_by_user_id: string | null
          admin_note: string | null
          created_at: string
          id: string
          message: string | null
          organization_id: string
          requested_by_user_id: string
          service_id: string
          status: Database["public"]["Enums"]["access_request_status"]
          updated_at: string
        }
        Insert: {
          admin_decision_at?: string | null
          admin_decision_by_user_id?: string | null
          admin_note?: string | null
          created_at?: string
          id?: string
          message?: string | null
          organization_id: string
          requested_by_user_id: string
          service_id: string
          status?: Database["public"]["Enums"]["access_request_status"]
          updated_at?: string
        }
        Update: {
          admin_decision_at?: string | null
          admin_decision_by_user_id?: string | null
          admin_note?: string | null
          created_at?: string
          id?: string
          message?: string | null
          organization_id?: string
          requested_by_user_id?: string
          service_id?: string
          status?: Database["public"]["Enums"]["access_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_requests_admin_decision_by_user_id_fkey"
            columns: ["admin_decision_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_requests_requested_by_user_id_fkey"
            columns: ["requested_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_type: Database["public"]["Enums"]["audit_actor_type"]
          actor_user_id: string | null
          created_at: string
          id: string
          metadata: Json
          organization_id: string
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          actor_type: Database["public"]["Enums"]["audit_actor_type"]
          actor_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          organization_id: string
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          actor_type?: Database["public"]["Enums"]["audit_actor_type"]
          actor_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          organization_id?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          category: Database["public"]["Enums"]["document_category"]
          created_at: string
          file_url: string
          id: string
          name: string
          organization_id: string
          requires_expert_review: boolean
          variables: string[]
          version: number
        }
        Insert: {
          category: Database["public"]["Enums"]["document_category"]
          created_at?: string
          file_url: string
          id?: string
          name: string
          organization_id: string
          requires_expert_review?: boolean
          variables?: string[]
          version?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["document_category"]
          created_at?: string
          file_url?: string
          id?: string
          name?: string
          organization_id?: string
          requires_expert_review?: boolean
          variables?: string[]
          version?: number
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
          category: Database["public"]["Enums"]["document_category"]
          created_at: string
          created_by_user_id: string
          file_url: string
          id: string
          organization_id: string
          site_id: string | null
          status: Database["public"]["Enums"]["document_status"]
          template_id: string | null
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          category: Database["public"]["Enums"]["document_category"]
          created_at?: string
          created_by_user_id: string
          file_url: string
          id?: string
          organization_id: string
          site_id?: string | null
          status: Database["public"]["Enums"]["document_status"]
          template_id?: string | null
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["document_category"]
          created_at?: string
          created_by_user_id?: string
          file_url?: string
          id?: string
          organization_id?: string
          site_id?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          template_id?: string | null
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
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
      entitlement_grants: {
        Row: {
          action: Database["public"]["Enums"]["entitlement_action"]
          expires_at: string | null
          id: string
          new_status: Database["public"]["Enums"]["entitlement_status"]
          note: string | null
          organization_id: string
          performed_at: string
          performed_by_user_id: string
          previous_status:
            | Database["public"]["Enums"]["entitlement_status"]
            | null
          service_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["entitlement_action"]
          expires_at?: string | null
          id?: string
          new_status: Database["public"]["Enums"]["entitlement_status"]
          note?: string | null
          organization_id: string
          performed_at?: string
          performed_by_user_id: string
          previous_status?:
            | Database["public"]["Enums"]["entitlement_status"]
            | null
          service_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["entitlement_action"]
          expires_at?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["entitlement_status"]
          note?: string | null
          organization_id?: string
          performed_at?: string
          performed_by_user_id?: string
          previous_status?:
            | Database["public"]["Enums"]["entitlement_status"]
            | null
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entitlement_grants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entitlement_grants_performed_by_user_id_fkey"
            columns: ["performed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entitlement_grants_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      expertise_requests: {
        Row: {
          assigned_expert_user_id: string | null
          attached_document_ids: string[]
          created_at: string
          description: string
          hours_spent: number
          id: string
          organization_id: string
          requested_by_user_id: string
          site_id: string | null
          status: Database["public"]["Enums"]["expertise_request_status"]
          type: Database["public"]["Enums"]["expertise_request_type"]
        }
        Insert: {
          assigned_expert_user_id?: string | null
          attached_document_ids?: string[]
          created_at?: string
          description: string
          hours_spent?: number
          id?: string
          organization_id: string
          requested_by_user_id: string
          site_id?: string | null
          status: Database["public"]["Enums"]["expertise_request_status"]
          type: Database["public"]["Enums"]["expertise_request_type"]
        }
        Update: {
          assigned_expert_user_id?: string | null
          attached_document_ids?: string[]
          created_at?: string
          description?: string
          hours_spent?: number
          id?: string
          organization_id?: string
          requested_by_user_id?: string
          site_id?: string | null
          status?: Database["public"]["Enums"]["expertise_request_status"]
          type?: Database["public"]["Enums"]["expertise_request_type"]
        }
        Relationships: [
          {
            foreignKeyName: "expertise_requests_assigned_expert_user_id_fkey"
            columns: ["assigned_expert_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expertise_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expertise_requests_requested_by_user_id_fkey"
            columns: ["requested_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expertise_requests_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      lots: {
        Row: {
          amount_ht: number | null
          assigned_organization_id: string | null
          id: string
          name: string
          number: string
          site_id: string
        }
        Insert: {
          amount_ht?: number | null
          assigned_organization_id?: string | null
          id?: string
          name: string
          number: string
          site_id: string
        }
        Update: {
          amount_ht?: number | null
          assigned_organization_id?: string | null
          id?: string
          name?: string
          number?: string
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lots_assigned_organization_id_fkey"
            columns: ["assigned_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lots_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_addresses: {
        Row: {
          address: string
          id: string
          is_active: boolean
          label: string
          organization_id: string
          site_id: string | null
        }
        Insert: {
          address: string
          id?: string
          is_active?: boolean
          label: string
          organization_id: string
          site_id?: string | null
        }
        Update: {
          address?: string
          id?: string
          is_active?: boolean
          label?: string
          organization_id?: string
          site_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mail_addresses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mail_addresses_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_threads: {
        Row: {
          assigned_user_id: string | null
          created_at: string
          from_address: string
          id: string
          last_message_at: string
          mail_address_id: string
          organization_id: string
          site_id: string | null
          status: Database["public"]["Enums"]["mail_status"]
          subject: string
          urgency: Database["public"]["Enums"]["mail_urgency"]
        }
        Insert: {
          assigned_user_id?: string | null
          created_at?: string
          from_address: string
          id?: string
          last_message_at: string
          mail_address_id: string
          organization_id: string
          site_id?: string | null
          status: Database["public"]["Enums"]["mail_status"]
          subject: string
          urgency: Database["public"]["Enums"]["mail_urgency"]
        }
        Update: {
          assigned_user_id?: string | null
          created_at?: string
          from_address?: string
          id?: string
          last_message_at?: string
          mail_address_id?: string
          organization_id?: string
          site_id?: string | null
          status?: Database["public"]["Enums"]["mail_status"]
          subject?: string
          urgency?: Database["public"]["Enums"]["mail_urgency"]
        }
        Relationships: [
          {
            foreignKeyName: "mail_threads_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mail_threads_mail_address_id_fkey"
            columns: ["mail_address_id"]
            isOneToOne: false
            referencedRelation: "mail_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mail_threads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mail_threads_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
          is_verified: boolean
          organization_id: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          is_verified?: boolean
          organization_id: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          is_verified?: boolean
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_domains_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_entitlements: {
        Row: {
          expires_at: string | null
          granted_at: string
          granted_by_user_id: string
          id: string
          notes: string | null
          organization_id: string
          price_id: string | null
          revoke_reason: string | null
          revoked_at: string | null
          revoked_by_user_id: string | null
          service_id: string
          source_access_request_id: string | null
          status: Database["public"]["Enums"]["entitlement_status"]
          updated_at: string
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string
          granted_by_user_id: string
          id?: string
          notes?: string | null
          organization_id: string
          price_id?: string | null
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by_user_id?: string | null
          service_id: string
          source_access_request_id?: string | null
          status: Database["public"]["Enums"]["entitlement_status"]
          updated_at?: string
        }
        Update: {
          expires_at?: string | null
          granted_at?: string
          granted_by_user_id?: string
          id?: string
          notes?: string | null
          organization_id?: string
          price_id?: string | null
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by_user_id?: string | null
          service_id?: string
          source_access_request_id?: string | null
          status?: Database["public"]["Enums"]["entitlement_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_entitlements_granted_by_user_id_fkey"
            columns: ["granted_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_entitlements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_entitlements_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "service_prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_entitlements_revoked_by_user_id_fkey"
            columns: ["revoked_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_entitlements_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_entitlements_source_access_request_id_fkey"
            columns: ["source_access_request_id"]
            isOneToOne: false
            referencedRelation: "access_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_integrations: {
        Row: {
          config: Json
          created_at: string
          id: string
          integration_type: Database["public"]["Enums"]["integration_type"]
          is_active: boolean
          managed_by: Database["public"]["Enums"]["integration_managed_by"]
          organization_id: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          integration_type: Database["public"]["Enums"]["integration_type"]
          is_active?: boolean
          managed_by?: Database["public"]["Enums"]["integration_managed_by"]
          organization_id: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          integration_type?: Database["public"]["Enums"]["integration_type"]
          is_active?: boolean
          managed_by?: Database["public"]["Enums"]["integration_managed_by"]
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          city: string | null
          country: string
          created_at: string
          domain: string | null
          domain_verified: boolean
          id: string
          legal_name: string
          logo_url: string | null
          name: string
          postal_code: string | null
          siret: string | null
          subscription_plan: Database["public"]["Enums"]["subscription_plan"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string
          created_at?: string
          domain?: string | null
          domain_verified?: boolean
          id?: string
          legal_name: string
          logo_url?: string | null
          name: string
          postal_code?: string | null
          siret?: string | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string
          created_at?: string
          domain?: string | null
          domain_verified?: boolean
          id?: string
          legal_name?: string
          logo_url?: string | null
          name?: string
          postal_code?: string | null
          siret?: string | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"]
          updated_at?: string
        }
        Relationships: []
      }
      phase_instances: {
        Row: {
          checklist: Json
          depends_on_phase_instance_ids: string[]
          end_date_actual: string | null
          end_date_target: string | null
          expected_document_types: string[]
          id: string
          phase_template_id: string
          responsible_user_id: string | null
          site_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["phase_instance_status"]
        }
        Insert: {
          checklist?: Json
          depends_on_phase_instance_ids?: string[]
          end_date_actual?: string | null
          end_date_target?: string | null
          expected_document_types?: string[]
          id?: string
          phase_template_id: string
          responsible_user_id?: string | null
          site_id: string
          start_date?: string | null
          status: Database["public"]["Enums"]["phase_instance_status"]
        }
        Update: {
          checklist?: Json
          depends_on_phase_instance_ids?: string[]
          end_date_actual?: string | null
          end_date_target?: string | null
          expected_document_types?: string[]
          id?: string
          phase_template_id?: string
          responsible_user_id?: string | null
          site_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["phase_instance_status"]
        }
        Relationships: [
          {
            foreignKeyName: "phase_instances_phase_template_id_fkey"
            columns: ["phase_template_id"]
            isOneToOne: false
            referencedRelation: "phase_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phase_instances_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phase_instances_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_template_sets: {
        Row: {
          id: string
          label: string
          mission_family: string
          phase_template_ids: string[]
        }
        Insert: {
          id?: string
          label: string
          mission_family: string
          phase_template_ids?: string[]
        }
        Update: {
          id?: string
          label?: string
          mission_family?: string
          phase_template_ids?: string[]
        }
        Relationships: []
      }
      phase_templates: {
        Row: {
          code: string
          default_duration_days: number | null
          description: string | null
          id: string
          label: string
        }
        Insert: {
          code: string
          default_duration_days?: number | null
          description?: string | null
          id?: string
          label: string
        }
        Update: {
          code?: string
          default_duration_days?: number | null
          description?: string | null
          id?: string
          label?: string
        }
        Relationships: []
      }
      plan_features: {
        Row: {
          enabled: boolean
          feature_key: string
          plan: Database["public"]["Enums"]["subscription_plan"]
        }
        Insert: {
          enabled?: boolean
          feature_key: string
          plan: Database["public"]["Enums"]["subscription_plan"]
        }
        Update: {
          enabled?: boolean
          feature_key?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
        }
        Relationships: []
      }
      portfolio_grants: {
        Row: {
          granted_at: string
          granted_by: string
          id: string
          organization_id: string
          revoked_at: string | null
          revoked_by: string | null
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by: string
          id?: string
          organization_id: string
          revoked_at?: string | null
          revoked_by?: string | null
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string
          id?: string
          organization_id?: string
          revoked_at?: string | null
          revoked_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_grants_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_grants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_grants_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_grants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_rules: {
        Row: {
          applies_to_contract_type: string
          channel: Database["public"]["Enums"]["reminder_channel"]
          days_after_due: number
          id: string
          site_id: string
          template_id: string | null
        }
        Insert: {
          applies_to_contract_type: string
          channel: Database["public"]["Enums"]["reminder_channel"]
          days_after_due: number
          id?: string
          site_id: string
          template_id?: string | null
        }
        Update: {
          applies_to_contract_type?: string
          channel?: Database["public"]["Enums"]["reminder_channel"]
          days_after_due?: number
          id?: string
          site_id?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reminder_rules_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_rules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      service_catalog: {
        Row: {
          billing_model: Database["public"]["Enums"]["service_billing_model"]
          category_id: string
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          requires_admin_approval: boolean
          updated_at: string
        }
        Insert: {
          billing_model: Database["public"]["Enums"]["service_billing_model"]
          category_id: string
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          requires_admin_approval?: boolean
          updated_at?: string
        }
        Update: {
          billing_model?: Database["public"]["Enums"]["service_billing_model"]
          category_id?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          requires_admin_approval?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_catalog_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          code: Database["public"]["Enums"]["service_category_code"]
          description: string | null
          id: string
          label: string
          sort_order: number
        }
        Insert: {
          code: Database["public"]["Enums"]["service_category_code"]
          description?: string | null
          id?: string
          label: string
          sort_order?: number
        }
        Update: {
          code?: Database["public"]["Enums"]["service_category_code"]
          description?: string | null
          id?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      service_prices: {
        Row: {
          amount_cents: number
          billing_period: Database["public"]["Enums"]["billing_period"]
          created_at: string
          created_by_user_id: string
          currency: string
          effective_from: string
          effective_to: string | null
          id: string
          service_id: string
        }
        Insert: {
          amount_cents: number
          billing_period?: Database["public"]["Enums"]["billing_period"]
          created_at?: string
          created_by_user_id: string
          currency?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          service_id: string
        }
        Update: {
          amount_cents?: number
          billing_period?: Database["public"]["Enums"]["billing_period"]
          created_at?: string
          created_by_user_id?: string
          currency?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_prices_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_prices_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      signature_profiles: {
        Row: {
          created_at: string
          created_by_user_id: string
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
          created_by_user_id: string
          id?: string
          label: string
          organization_id: string
          signature_style: string
          signer_name: string
          signer_role: string
          updated_at?: string
          whatsapp_enabled?: boolean
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
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
            foreignKeyName: "signature_profiles_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signature_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      site_access: {
        Row: {
          can_edit_documents: boolean
          can_manage_finance: boolean
          can_validate: boolean
          id: string
          site_id: string
          user_id: string
        }
        Insert: {
          can_edit_documents?: boolean
          can_manage_finance?: boolean
          can_validate?: boolean
          id?: string
          site_id: string
          user_id: string
        }
        Update: {
          can_edit_documents?: boolean
          can_manage_finance?: boolean
          can_validate?: boolean
          id?: string
          site_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_access_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      site_participants: {
        Row: {
          contract_amount_ht: number | null
          id: string
          joined_at: string
          lot_id: string | null
          mission_role: Database["public"]["Enums"]["mission_role"]
          organization_id: string
          site_id: string
        }
        Insert: {
          contract_amount_ht?: number | null
          id?: string
          joined_at?: string
          lot_id?: string | null
          mission_role: Database["public"]["Enums"]["mission_role"]
          organization_id: string
          site_id: string
        }
        Update: {
          contract_amount_ht?: number | null
          id?: string
          joined_at?: string
          lot_id?: string | null
          mission_role?: Database["public"]["Enums"]["mission_role"]
          organization_id?: string
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_participants_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_participants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_participants_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          address: string
          budget_ht: number | null
          city: string
          created_at: string
          end_date_estimated: string | null
          id: string
          manager_user_id: string | null
          name: string
          organization_id: string
          postal_code: string | null
          reference: string
          start_date: string | null
          status: Database["public"]["Enums"]["site_status"]
          updated_at: string
        }
        Insert: {
          address: string
          budget_ht?: number | null
          city: string
          created_at?: string
          end_date_estimated?: string | null
          id?: string
          manager_user_id?: string | null
          name: string
          organization_id: string
          postal_code?: string | null
          reference: string
          start_date?: string | null
          status: Database["public"]["Enums"]["site_status"]
          updated_at?: string
        }
        Update: {
          address?: string
          budget_ht?: number | null
          city?: string
          created_at?: string
          end_date_estimated?: string | null
          id?: string
          manager_user_id?: string | null
          name?: string
          organization_id?: string
          postal_code?: string | null
          reference?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["site_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_manager_user_id_fkey"
            columns: ["manager_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      situations: {
        Row: {
          amount_ht: number
          dispute_reason: string | null
          due_date: string | null
          id: string
          lot_id: string | null
          number: number
          paid_at: string | null
          site_id: string
          status: Database["public"]["Enums"]["payment_status"]
          submitted_at: string | null
        }
        Insert: {
          amount_ht: number
          dispute_reason?: string | null
          due_date?: string | null
          id?: string
          lot_id?: string | null
          number: number
          paid_at?: string | null
          site_id: string
          status: Database["public"]["Enums"]["payment_status"]
          submitted_at?: string | null
        }
        Update: {
          amount_ht?: number
          dispute_reason?: string | null
          due_date?: string | null
          id?: string
          lot_id?: string | null
          number?: number
          paid_at?: string | null
          site_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "situations_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "situations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_user_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          organization_id: string
          priority: Database["public"]["Enums"]["task_priority"]
          site_id: string | null
          source_id: string | null
          source_type: Database["public"]["Enums"]["task_source_type"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
        }
        Insert: {
          assigned_user_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id: string
          priority: Database["public"]["Enums"]["task_priority"]
          site_id?: string | null
          source_id?: string | null
          source_type?: Database["public"]["Enums"]["task_source_type"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
        }
        Update: {
          assigned_user_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          site_id?: string | null
          source_id?: string | null
          source_type?: Database["public"]["Enums"]["task_source_type"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          last_login_at: string | null
          mfa_enabled: boolean
          organization_id: string | null
          permission_role: Database["public"]["Enums"]["user_permission_role"]
          role_scope: Database["public"]["Enums"]["role_scope"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          last_login_at?: string | null
          mfa_enabled?: boolean
          organization_id?: string | null
          permission_role: Database["public"]["Enums"]["user_permission_role"]
          role_scope: Database["public"]["Enums"]["role_scope"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          mfa_enabled?: boolean
          organization_id?: string | null
          permission_role?: Database["public"]["Enums"]["user_permission_role"]
          role_scope?: Database["public"]["Enums"]["role_scope"]
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      validation_records: {
        Row: {
          comment: string | null
          decided_at: string | null
          decided_by_user_id: string | null
          decision: Database["public"]["Enums"]["approval_decision"] | null
          document_id: string
          id: string
          is_legally_binding_signature: boolean
          signature_envelope_id: string | null
          signature_provider: string | null
          step: Database["public"]["Enums"]["validation_step"]
          whatsapp_proof_url: string | null
        }
        Insert: {
          comment?: string | null
          decided_at?: string | null
          decided_by_user_id?: string | null
          decision?: Database["public"]["Enums"]["approval_decision"] | null
          document_id: string
          id?: string
          is_legally_binding_signature?: boolean
          signature_envelope_id?: string | null
          signature_provider?: string | null
          step: Database["public"]["Enums"]["validation_step"]
          whatsapp_proof_url?: string | null
        }
        Update: {
          comment?: string | null
          decided_at?: string | null
          decided_by_user_id?: string | null
          decision?: Database["public"]["Enums"]["approval_decision"] | null
          document_id?: string
          id?: string
          is_legally_binding_signature?: boolean
          signature_envelope_id?: string | null
          signature_provider?: string | null
          step?: Database["public"]["Enums"]["validation_step"]
          whatsapp_proof_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "validation_records_decided_by_user_id_fkey"
            columns: ["decided_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validation_records_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _upsert_entitlement: {
        Args: {
          p_action: Database["public"]["Enums"]["entitlement_action"]
          p_expires_at: string
          p_new_status: Database["public"]["Enums"]["entitlement_status"]
          p_note: string
          p_org_id: string
          p_price_id: string
          p_service_id: string
          p_source_request_id: string
        }
        Returns: undefined
      }
      approve_access_request: {
        Args: {
          p_admin_note?: string
          p_expires_at?: string
          p_price_id?: string
          p_request_id: string
        }
        Returns: undefined
      }
      can_access_organization: {
        Args: { target_org_id: string }
        Returns: boolean
      }
      can_access_site: { Args: { target_site_id: string }; Returns: boolean }
      cancel_access_request: {
        Args: { p_request_id: string }
        Returns: undefined
      }
      current_app_user_id: { Args: never; Returns: string }
      current_user_organization_id: { Args: never; Returns: string }
      current_user_permission_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_permission_role"]
      }
      extend_entitlement: {
        Args: {
          p_new_expires_at: string
          p_note?: string
          p_organization_id: string
          p_service_id: string
        }
        Returns: undefined
      }
      grant_entitlement: {
        Args: {
          p_expires_at?: string
          p_note?: string
          p_organization_id: string
          p_price_id?: string
          p_service_id: string
        }
        Returns: undefined
      }
      has_entitlement: {
        Args: { target_org_id: string; target_service_code: string }
        Returns: boolean
      }
      has_portfolio_access: {
        Args: { target_org_id: string }
        Returns: boolean
      }
      reactivate_entitlement: {
        Args: {
          p_expires_at?: string
          p_note?: string
          p_organization_id: string
          p_service_id: string
        }
        Returns: undefined
      }
      reject_access_request: {
        Args: { p_admin_note?: string; p_request_id: string }
        Returns: undefined
      }
      request_service_access: {
        Args: {
          p_message?: string
          p_organization_id: string
          p_service_id: string
        }
        Returns: string
      }
      revoke_entitlement: {
        Args: {
          p_organization_id: string
          p_reason?: string
          p_service_id: string
        }
        Returns: undefined
      }
      suspend_entitlement: {
        Args: {
          p_note?: string
          p_organization_id: string
          p_service_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      access_request_status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"
      approval_decision: "APPROUVE" | "REFUSE" | "MODIFICATION_DEMANDEE"
      audit_actor_type: "USER" | "AUTOMATION" | "AI"
      billing_period: "MONTHLY" | "ANNUAL" | "ONE_TIME"
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
        | "AUTRE"
      document_status:
        | "BROUILLON"
        | "PREEDITION"
        | "EN_CONTROLE"
        | "EN_VALIDATION"
        | "VALIDE"
        | "ENVOYE"
        | "ARCHIVE"
      entitlement_action:
        | "GRANT"
        | "SUSPEND"
        | "REACTIVATE"
        | "EXTEND"
        | "REVOKE"
      entitlement_status: "ACTIVE" | "SUSPENDED" | "EXPIRED" | "REVOKED"
      expertise_request_status:
        | "NOUVELLE"
        | "ASSIGNEE"
        | "EN_COURS"
        | "RAPPORT_LIVRE"
        | "CLOTUREE"
      expertise_request_type:
        | "AVIS_INGENIEUR"
        | "CONSULTATION_ARCHITECTE"
        | "ANALYSE_EXE"
        | "ANALYSE_DOE"
        | "RELECTURE_MEMOIRE_TECHNIQUE"
        | "ASSISTANCE_APPEL_OFFRES"
        | "AUTRE"
      integration_managed_by: "ADMINBTP" | "CLIENT"
      integration_type: "ODOO" | "N8N" | "EMAIL" | "WHATSAPP" | "AI"
      mail_status:
        | "NON_TRAITE"
        | "AFFECTE"
        | "BROUILLON_PRET"
        | "EN_VALIDATION"
        | "REPONDU"
        | "CLOTURE"
      mail_urgency: "NORMALE" | "URGENTE" | "CRITIQUE"
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
        | "COLLECTIVITE"
      payment_status:
        | "A_ETABLIR"
        | "TRANSMIS"
        | "EN_VERIFICATION"
        | "ACCEPTE"
        | "CONTESTE"
        | "PAYE"
      phase_instance_status:
        | "A_VENIR"
        | "EN_COURS"
        | "EN_ATTENTE_VALIDATION"
        | "VALIDEE"
        | "BLOQUEE"
        | "ANNULEE"
      reminder_channel: "EMAIL" | "WHATSAPP" | "COURRIER"
      role_scope: "PLATEFORME" | "ENTREPRISE"
      service_billing_model:
        | "FREE"
        | "SUBSCRIPTION_MONTHLY"
        | "SUBSCRIPTION_ANNUAL"
        | "PER_UNIT"
        | "PREPAID_CREDIT"
        | "CREDIT_PACK"
        | "SERVICE_PACKAGE"
        | "CUSTOM"
        | "QUOTE"
      service_category_code:
        | "DIRECTORY"
        | "DOCUMENTS"
        | "AUTOMATION"
        | "AI"
        | "MESSAGING"
        | "SITE_MANAGEMENT"
        | "INTEGRATIONS"
        | "SIGNATURES"
        | "EXPERT_SERVICES"
        | "CUSTOM_SERVICES"
      site_status:
        | "ETUDE"
        | "CONSULTATION"
        | "PREPARATION"
        | "EN_COURS"
        | "RECEPTION"
        | "GPA"
        | "CLOTURE"
        | "SUSPENDU"
      subscription_plan: "DEMO" | "STARTER" | "PRO" | "ENTERPRISE"
      task_priority: "BASSE" | "NORMALE" | "HAUTE" | "CRITIQUE"
      task_source_type:
        | "MANUEL"
        | "MAIL"
        | "PHASE"
        | "VALIDATION"
        | "AUTOMATISATION"
      task_status: "A_FAIRE" | "EN_COURS" | "EN_ATTENTE" | "FAIT" | "ANNULE"
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
        | "OBSERVATEUR"
      validation_step:
        | "PREPARATION"
        | "CONTROLE_GESTIONNAIRE"
        | "VALIDATION_DIRIGEANT"
        | "SIGNATURE"
        | "ENVOI"
        | "ARCHIVAGE"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      access_request_status: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"],
      approval_decision: ["APPROUVE", "REFUSE", "MODIFICATION_DEMANDEE"],
      audit_actor_type: ["USER", "AUTOMATION", "AI"],
      billing_period: ["MONTHLY", "ANNUAL", "ONE_TIME"],
      document_category: [
        "COURRIER",
        "COMPTE_RENDU",
        "PPSPS",
        "DC4",
        "AGREMENT_SOUS_TRAITANT",
        "RESERVES",
        "SITUATION_TRAVAUX",
        "DOE",
        "DGD",
        "MARCHE",
        "ADMINISTRATIF",
        "AUTRE",
      ],
      document_status: [
        "BROUILLON",
        "PREEDITION",
        "EN_CONTROLE",
        "EN_VALIDATION",
        "VALIDE",
        "ENVOYE",
        "ARCHIVE",
      ],
      entitlement_action: [
        "GRANT",
        "SUSPEND",
        "REACTIVATE",
        "EXTEND",
        "REVOKE",
      ],
      entitlement_status: ["ACTIVE", "SUSPENDED", "EXPIRED", "REVOKED"],
      expertise_request_status: [
        "NOUVELLE",
        "ASSIGNEE",
        "EN_COURS",
        "RAPPORT_LIVRE",
        "CLOTUREE",
      ],
      expertise_request_type: [
        "AVIS_INGENIEUR",
        "CONSULTATION_ARCHITECTE",
        "ANALYSE_EXE",
        "ANALYSE_DOE",
        "RELECTURE_MEMOIRE_TECHNIQUE",
        "ASSISTANCE_APPEL_OFFRES",
        "AUTRE",
      ],
      integration_managed_by: ["ADMINBTP", "CLIENT"],
      integration_type: ["ODOO", "N8N", "EMAIL", "WHATSAPP", "AI"],
      mail_status: [
        "NON_TRAITE",
        "AFFECTE",
        "BROUILLON_PRET",
        "EN_VALIDATION",
        "REPONDU",
        "CLOTURE",
      ],
      mail_urgency: ["NORMALE", "URGENTE", "CRITIQUE"],
      mission_role: [
        "MOA",
        "MOE",
        "AMO",
        "OPC",
        "BET",
        "ENTREPRISE_TCE",
        "ENTREPRISE_GENERALE",
        "ENTREPRISE_LOT",
        "SOUS_TRAITANT",
        "PROMOTEUR",
        "BAILLEUR_SOCIAL",
        "COLLECTIVITE",
      ],
      payment_status: [
        "A_ETABLIR",
        "TRANSMIS",
        "EN_VERIFICATION",
        "ACCEPTE",
        "CONTESTE",
        "PAYE",
      ],
      phase_instance_status: [
        "A_VENIR",
        "EN_COURS",
        "EN_ATTENTE_VALIDATION",
        "VALIDEE",
        "BLOQUEE",
        "ANNULEE",
      ],
      reminder_channel: ["EMAIL", "WHATSAPP", "COURRIER"],
      role_scope: ["PLATEFORME", "ENTREPRISE"],
      service_billing_model: [
        "FREE",
        "SUBSCRIPTION_MONTHLY",
        "SUBSCRIPTION_ANNUAL",
        "PER_UNIT",
        "PREPAID_CREDIT",
        "CREDIT_PACK",
        "SERVICE_PACKAGE",
        "CUSTOM",
        "QUOTE",
      ],
      service_category_code: [
        "DIRECTORY",
        "DOCUMENTS",
        "AUTOMATION",
        "AI",
        "MESSAGING",
        "SITE_MANAGEMENT",
        "INTEGRATIONS",
        "SIGNATURES",
        "EXPERT_SERVICES",
        "CUSTOM_SERVICES",
      ],
      site_status: [
        "ETUDE",
        "CONSULTATION",
        "PREPARATION",
        "EN_COURS",
        "RECEPTION",
        "GPA",
        "CLOTURE",
        "SUSPENDU",
      ],
      subscription_plan: ["DEMO", "STARTER", "PRO", "ENTERPRISE"],
      task_priority: ["BASSE", "NORMALE", "HAUTE", "CRITIQUE"],
      task_source_type: [
        "MANUEL",
        "MAIL",
        "PHASE",
        "VALIDATION",
        "AUTOMATISATION",
      ],
      task_status: ["A_FAIRE", "EN_COURS", "EN_ATTENTE", "FAIT", "ANNULE"],
      user_permission_role: [
        "ADMIN_PLATEFORME",
        "RESPONSABLE_PORTEFEUILLE",
        "GESTIONNAIRE_ADMINISTRATIF",
        "CHARGE_AFFAIRES",
        "ASSISTANT_ADMINISTRATIF",
        "EXPERT_TECHNIQUE",
        "VALIDATEUR",
        "DIRIGEANT_CLIENT",
        "COLLABORATEUR_CLIENT",
        "OBSERVATEUR",
      ],
      validation_step: [
        "PREPARATION",
        "CONTROLE_GESTIONNAIRE",
        "VALIDATION_DIRIGEANT",
        "SIGNATURE",
        "ENVOI",
        "ARCHIVAGE",
      ],
    },
  },
} as const
