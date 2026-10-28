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
          document_template_catalog_id: string | null
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
          document_template_catalog_id?: string | null
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
          document_template_catalog_id?: string | null
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
            foreignKeyName: "access_requests_document_template_catalog_id_fkey"
            columns: ["document_template_catalog_id"]
            isOneToOne: false
            referencedRelation: "document_template_catalog"
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
      act_templates: {
        Row: {
          code: string
          depends_on_act_code: string | null
          document_category: Database["public"]["Enums"]["document_category"]
          id: string
          label: string
          mission_family: string
          required_mission_role: Database["public"]["Enums"]["mission_role"]
          sort_order: number
          unlocks_phase_template_code: string | null
        }
        Insert: {
          code: string
          depends_on_act_code?: string | null
          document_category: Database["public"]["Enums"]["document_category"]
          id?: string
          label: string
          mission_family: string
          required_mission_role: Database["public"]["Enums"]["mission_role"]
          sort_order?: number
          unlocks_phase_template_code?: string | null
        }
        Update: {
          code?: string
          depends_on_act_code?: string | null
          document_category?: Database["public"]["Enums"]["document_category"]
          id?: string
          label?: string
          mission_family?: string
          required_mission_role?: Database["public"]["Enums"]["mission_role"]
          sort_order?: number
          unlocks_phase_template_code?: string | null
        }
        Relationships: []
      }
      amendments: {
        Row: {
          created_at: string
          delta_ht: number
          id: string
          lot_id: string | null
          number: number
          reason: string
          site_id: string
          source_log_entry_id: string | null
          status: Database["public"]["Enums"]["amendment_status"]
          updated_at: string
          validated_at: string | null
          validated_by_user_id: string | null
        }
        Insert: {
          created_at?: string
          delta_ht: number
          id?: string
          lot_id?: string | null
          number: number
          reason: string
          site_id: string
          source_log_entry_id?: string | null
          status?: Database["public"]["Enums"]["amendment_status"]
          updated_at?: string
          validated_at?: string | null
          validated_by_user_id?: string | null
        }
        Update: {
          created_at?: string
          delta_ht?: number
          id?: string
          lot_id?: string | null
          number?: number
          reason?: string
          site_id?: string
          source_log_entry_id?: string | null
          status?: Database["public"]["Enums"]["amendment_status"]
          updated_at?: string
          validated_at?: string | null
          validated_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "amendments_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amendments_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amendments_source_log_entry_id_fkey"
            columns: ["source_log_entry_id"]
            isOneToOne: false
            referencedRelation: "site_log_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amendments_validated_by_user_id_fkey"
            columns: ["validated_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
      directory_access_log: {
        Row: {
          accessed_at: string
          accessed_by_user_id: string
          company_id: string
          id: string
          organization_id: string
        }
        Insert: {
          accessed_at?: string
          accessed_by_user_id: string
          company_id: string
          id?: string
          organization_id: string
        }
        Update: {
          accessed_at?: string
          accessed_by_user_id?: string
          company_id?: string
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "directory_access_log_accessed_by_user_id_fkey"
            columns: ["accessed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directory_access_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "directory_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directory_access_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      directory_categories: {
        Row: {
          code: string
          id: string
          label: string
          service_code: string
        }
        Insert: {
          code: string
          id?: string
          label: string
          service_code: string
        }
        Update: {
          code?: string
          id?: string
          label?: string
          service_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "directory_categories_service_code_fkey"
            columns: ["service_code"]
            isOneToOne: false
            referencedRelation: "service_catalog"
            referencedColumns: ["code"]
          },
        ]
      }
      directory_companies: {
        Row: {
          address: string | null
          category_id: string
          city: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          siret: string | null
          source_id: string | null
          trade_code_id: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          category_id: string
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          siret?: string | null
          source_id?: string | null
          trade_code_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          category_id?: string
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          siret?: string | null
          source_id?: string | null
          trade_code_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directory_companies_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "directory_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directory_companies_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "directory_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directory_companies_trade_code_id_fkey"
            columns: ["trade_code_id"]
            isOneToOne: false
            referencedRelation: "trade_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      directory_contacts: {
        Row: {
          company_id: string
          email: string | null
          full_name: string
          id: string
          is_primary: boolean
          phone: string | null
          role: string | null
        }
        Insert: {
          company_id: string
          email?: string | null
          full_name: string
          id?: string
          is_primary?: boolean
          phone?: string | null
          role?: string | null
        }
        Update: {
          company_id?: string
          email?: string | null
          full_name?: string
          id?: string
          is_primary?: boolean
          phone?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directory_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "directory_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      directory_sources: {
        Row: {
          created_count: number
          error_count: number
          id: string
          imported_at: string
          imported_by_user_id: string
          label: string
          skipped_count: number
        }
        Insert: {
          created_count?: number
          error_count?: number
          id?: string
          imported_at?: string
          imported_by_user_id: string
          label: string
          skipped_count?: number
        }
        Update: {
          created_count?: number
          error_count?: number
          id?: string
          imported_at?: string
          imported_by_user_id?: string
          label?: string
          skipped_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "directory_sources_imported_by_user_id_fkey"
            columns: ["imported_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      document_reviews: {
        Row: {
          created_at: string
          created_by_user_id: string | null
          document_id: string
          findings: Json
          id: string
          source: Database["public"]["Enums"]["document_review_source"]
          verdict: Database["public"]["Enums"]["document_review_verdict"]
        }
        Insert: {
          created_at?: string
          created_by_user_id?: string | null
          document_id: string
          findings?: Json
          id?: string
          source: Database["public"]["Enums"]["document_review_source"]
          verdict: Database["public"]["Enums"]["document_review_verdict"]
        }
        Update: {
          created_at?: string
          created_by_user_id?: string | null
          document_id?: string
          findings?: Json
          id?: string
          source?: Database["public"]["Enums"]["document_review_source"]
          verdict?: Database["public"]["Enums"]["document_review_verdict"]
        }
        Relationships: [
          {
            foreignKeyName: "document_reviews_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_reviews_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_template_catalog: {
        Row: {
          category: Database["public"]["Enums"]["document_category"]
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          service_code: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["document_category"]
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          service_code: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["document_category"]
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          service_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_template_catalog_service_code_fkey"
            columns: ["service_code"]
            isOneToOne: false
            referencedRelation: "service_catalog"
            referencedColumns: ["code"]
          },
        ]
      }
      document_templates: {
        Row: {
          audience_legal_kind: Database["public"]["Enums"]["legal_kind"] | null
          audience_trade_code: string | null
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
          audience_legal_kind?: Database["public"]["Enums"]["legal_kind"] | null
          audience_trade_code?: string | null
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
          audience_legal_kind?: Database["public"]["Enums"]["legal_kind"] | null
          audience_trade_code?: string | null
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
            foreignKeyName: "document_templates_audience_trade_code_fkey"
            columns: ["audience_trade_code"]
            isOneToOne: false
            referencedRelation: "trade_codes"
            referencedColumns: ["code"]
          },
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
          act_code: string | null
          category: Database["public"]["Enums"]["document_category"]
          concerns_organization_id: string | null
          created_at: string
          created_by_user_id: string
          file_url: string
          id: string
          lot_id: string | null
          organization_id: string
          premium_template_version_id: string | null
          site_id: string | null
          source_log_entry_id: string | null
          status: Database["public"]["Enums"]["document_status"]
          template_id: string | null
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          act_code?: string | null
          category: Database["public"]["Enums"]["document_category"]
          concerns_organization_id?: string | null
          created_at?: string
          created_by_user_id: string
          file_url: string
          id?: string
          lot_id?: string | null
          organization_id: string
          premium_template_version_id?: string | null
          site_id?: string | null
          source_log_entry_id?: string | null
          status: Database["public"]["Enums"]["document_status"]
          template_id?: string | null
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          act_code?: string | null
          category?: Database["public"]["Enums"]["document_category"]
          concerns_organization_id?: string | null
          created_at?: string
          created_by_user_id?: string
          file_url?: string
          id?: string
          lot_id?: string | null
          organization_id?: string
          premium_template_version_id?: string | null
          site_id?: string | null
          source_log_entry_id?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          template_id?: string | null
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_concerns_organization_id_fkey"
            columns: ["concerns_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
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
            foreignKeyName: "documents_premium_template_version_id_fkey"
            columns: ["premium_template_version_id"]
            isOneToOne: false
            referencedRelation: "template_versions"
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
            foreignKeyName: "documents_source_log_entry_id_fkey"
            columns: ["source_log_entry_id"]
            isOneToOne: false
            referencedRelation: "site_log_entries"
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
      lot_members: {
        Row: {
          id: string
          lot_id: string
          organization_id: string
          role: Database["public"]["Enums"]["lot_member_role"]
          share_percent: number | null
        }
        Insert: {
          id?: string
          lot_id: string
          organization_id: string
          role: Database["public"]["Enums"]["lot_member_role"]
          share_percent?: number | null
        }
        Update: {
          id?: string
          lot_id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["lot_member_role"]
          share_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lot_members_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lot_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lot_progress: {
        Row: {
          created_at: string
          created_by_user_id: string
          declared_percent: number
          id: string
          lot_id: string
          record_date: string
        }
        Insert: {
          created_at?: string
          created_by_user_id: string
          declared_percent: number
          id?: string
          lot_id: string
          record_date: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          declared_percent?: number
          id?: string
          lot_id?: string
          record_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "lot_progress_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lot_progress_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
        ]
      }
      lot_schedule_notes: {
        Row: {
          created_at: string
          created_by_user_id: string
          id: string
          lot_id: string
          needs_lot_id: string | null
          note: string
          week: string
        }
        Insert: {
          created_at?: string
          created_by_user_id: string
          id?: string
          lot_id: string
          needs_lot_id?: string | null
          note: string
          week: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          id?: string
          lot_id?: string
          needs_lot_id?: string | null
          note?: string
          week?: string
        }
        Relationships: [
          {
            foreignKeyName: "lot_schedule_notes_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lot_schedule_notes_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lot_schedule_notes_needs_lot_id_fkey"
            columns: ["needs_lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
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
          parent_lot_id: string | null
          site_id: string
        }
        Insert: {
          amount_ht?: number | null
          assigned_organization_id?: string | null
          id?: string
          name: string
          number: string
          parent_lot_id?: string | null
          site_id: string
        }
        Update: {
          amount_ht?: number | null
          assigned_organization_id?: string | null
          id?: string
          name?: string
          number?: string
          parent_lot_id?: string | null
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
            foreignKeyName: "lots_parent_lot_id_fkey"
            columns: ["parent_lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
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
      market_clauses: {
        Row: {
          contract_id: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["market_clause_kind"]
          payload: Json
          source_document_id: string | null
          status: Database["public"]["Enums"]["extraction_status"]
          updated_at: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["market_clause_kind"]
          payload?: Json
          source_document_id?: string | null
          status?: Database["public"]["Enums"]["extraction_status"]
          updated_at?: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["market_clause_kind"]
          payload?: Json
          source_document_id?: string | null
          status?: Database["public"]["Enums"]["extraction_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_clauses_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "market_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_clauses_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      market_contracts: {
        Row: {
          advance_amount_ht: number | null
          caution_document_id: string | null
          contract_type: Database["public"]["Enums"]["market_contract_type"]
          created_at: string
          id: string
          lot_id: string | null
          payment_term_days: number | null
          price_reference_month: string | null
          retention_basis_amount_ht: number | null
          retention_guarantee_rate: number | null
          retention_release_due_on: string | null
          retention_substituted_by_caution: boolean
          site_id: string
          updated_at: string
        }
        Insert: {
          advance_amount_ht?: number | null
          caution_document_id?: string | null
          contract_type: Database["public"]["Enums"]["market_contract_type"]
          created_at?: string
          id?: string
          lot_id?: string | null
          payment_term_days?: number | null
          price_reference_month?: string | null
          retention_basis_amount_ht?: number | null
          retention_guarantee_rate?: number | null
          retention_release_due_on?: string | null
          retention_substituted_by_caution?: boolean
          site_id: string
          updated_at?: string
        }
        Update: {
          advance_amount_ht?: number | null
          caution_document_id?: string | null
          contract_type?: Database["public"]["Enums"]["market_contract_type"]
          created_at?: string
          id?: string
          lot_id?: string | null
          payment_term_days?: number | null
          price_reference_month?: string | null
          retention_basis_amount_ht?: number | null
          retention_guarantee_rate?: number | null
          retention_release_due_on?: string | null
          retention_substituted_by_caution?: boolean
          site_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_contracts_caution_document_id_fkey"
            columns: ["caution_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_contracts_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_contracts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_agenda_items: {
        Row: {
          created_at: string
          document_id: string | null
          id: string
          meeting_id: string
          source_log_entry_id: string | null
          task_id: string | null
          text: string | null
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          id?: string
          meeting_id: string
          source_log_entry_id?: string | null
          task_id?: string | null
          text?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string | null
          id?: string
          meeting_id?: string
          source_log_entry_id?: string | null
          task_id?: string | null
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_agenda_items_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_agenda_items_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meeting_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_agenda_items_source_log_entry_id_fkey"
            columns: ["source_log_entry_id"]
            isOneToOne: false
            referencedRelation: "site_log_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_agenda_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_attendees: {
        Row: {
          id: string
          meeting_id: string
          name: string
          organization_id: string
          status: Database["public"]["Enums"]["attendee_status"]
        }
        Insert: {
          id?: string
          meeting_id: string
          name: string
          organization_id: string
          status?: Database["public"]["Enums"]["attendee_status"]
        }
        Update: {
          id?: string
          meeting_id?: string
          name?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["attendee_status"]
        }
        Relationships: [
          {
            foreignKeyName: "meeting_attendees_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meeting_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_attendees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_decisions: {
        Row: {
          id: string
          lot_id: string | null
          meeting_id: string
          task_id: string | null
          text: string
        }
        Insert: {
          id?: string
          lot_id?: string | null
          meeting_id: string
          task_id?: string | null
          text: string
        }
        Update: {
          id?: string
          lot_id?: string | null
          meeting_id?: string
          task_id?: string | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_decisions_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_decisions_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meeting_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_decisions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_note_acknowledgments: {
        Row: {
          acknowledged_at: string
          acknowledged_by_user_id: string
          id: string
          meeting_id: string
          organization_id: string
        }
        Insert: {
          acknowledged_at?: string
          acknowledged_by_user_id: string
          id?: string
          meeting_id: string
          organization_id: string
        }
        Update: {
          acknowledged_at?: string
          acknowledged_by_user_id?: string
          id?: string
          meeting_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_note_acknowledgments_acknowledged_by_user_id_fkey"
            columns: ["acknowledged_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_note_acknowledgments_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meeting_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_note_acknowledgments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_note_distributions: {
        Row: {
          channel: Database["public"]["Enums"]["meeting_note_distribution_channel"]
          id: string
          meeting_id: string
          organization_id: string
          sent_at: string
          sent_by_user_id: string
        }
        Insert: {
          channel?: Database["public"]["Enums"]["meeting_note_distribution_channel"]
          id?: string
          meeting_id: string
          organization_id: string
          sent_at?: string
          sent_by_user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["meeting_note_distribution_channel"]
          id?: string
          meeting_id?: string
          organization_id?: string
          sent_at?: string
          sent_by_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_note_distributions_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meeting_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_note_distributions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_note_distributions_sent_by_user_id_fkey"
            columns: ["sent_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_notes: {
        Row: {
          author_organization_id: string | null
          created_at: string
          created_by_user_id: string
          deleted_at: string | null
          deleted_by_user_id: string | null
          deletion_reason: string | null
          document_id: string | null
          id: string
          kind: Database["public"]["Enums"]["meeting_kind"]
          meeting_date: string
          number: number | null
          site_id: string
          status: Database["public"]["Enums"]["meeting_status"]
          validated_at: string | null
          validated_by_user_id: string | null
        }
        Insert: {
          author_organization_id?: string | null
          created_at?: string
          created_by_user_id: string
          deleted_at?: string | null
          deleted_by_user_id?: string | null
          deletion_reason?: string | null
          document_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["meeting_kind"]
          meeting_date: string
          number?: number | null
          site_id: string
          status?: Database["public"]["Enums"]["meeting_status"]
          validated_at?: string | null
          validated_by_user_id?: string | null
        }
        Update: {
          author_organization_id?: string | null
          created_at?: string
          created_by_user_id?: string
          deleted_at?: string | null
          deleted_by_user_id?: string | null
          deletion_reason?: string | null
          document_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["meeting_kind"]
          meeting_date?: string
          number?: number | null
          site_id?: string
          status?: Database["public"]["Enums"]["meeting_status"]
          validated_at?: string | null
          validated_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_notes_author_organization_id_fkey"
            columns: ["author_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_notes_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_notes_deleted_by_user_id_fkey"
            columns: ["deleted_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_notes_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_notes_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_notes_validated_by_user_id_fkey"
            columns: ["validated_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_credentials: {
        Row: {
          created_at: string
          document_id: string | null
          expires_on: string | null
          id: string
          kind: Database["public"]["Enums"]["credential_kind"]
          organization_id: string
          status: Database["public"]["Enums"]["credential_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          expires_on?: string | null
          id?: string
          kind: Database["public"]["Enums"]["credential_kind"]
          organization_id: string
          status?: Database["public"]["Enums"]["credential_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_id?: string | null
          expires_on?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["credential_kind"]
          organization_id?: string
          status?: Database["public"]["Enums"]["credential_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_credentials_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_credentials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          access_quota: number | null
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
          access_quota?: number | null
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
          access_quota?: number | null
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
      organization_profiles: {
        Row: {
          created_at: string
          default_mission_roles: Database["public"]["Enums"]["mission_role"][]
          id: string
          legal_kind: Database["public"]["Enums"]["legal_kind"]
          organization_id: string
          size_band:
            | Database["public"]["Enums"]["organization_size_band"]
            | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_mission_roles?: Database["public"]["Enums"]["mission_role"][]
          id?: string
          legal_kind: Database["public"]["Enums"]["legal_kind"]
          organization_id: string
          size_band?:
            | Database["public"]["Enums"]["organization_size_band"]
            | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_mission_roles?: Database["public"]["Enums"]["mission_role"][]
          id?: string
          legal_kind?: Database["public"]["Enums"]["legal_kind"]
          organization_id?: string
          size_band?:
            | Database["public"]["Enums"]["organization_size_band"]
            | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_trades: {
        Row: {
          id: string
          is_primary: boolean
          organization_id: string
          trade_code_id: string
        }
        Insert: {
          id?: string
          is_primary?: boolean
          organization_id: string
          trade_code_id: string
        }
        Update: {
          id?: string
          is_primary?: boolean
          organization_id?: string
          trade_code_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_trades_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_trades_trade_code_id_fkey"
            columns: ["trade_code_id"]
            isOneToOne: false
            referencedRelation: "trade_codes"
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
      plan_submissions: {
        Row: {
          author_user_id: string
          created_at: string
          document_id: string
          id: string
          lot_id: string | null
          remarks: string | null
          reviewed_at: string | null
          reviewed_by_user_id: string | null
          site_id: string
          status: Database["public"]["Enums"]["plan_submission_status"]
        }
        Insert: {
          author_user_id: string
          created_at?: string
          document_id: string
          id?: string
          lot_id?: string | null
          remarks?: string | null
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          site_id: string
          status?: Database["public"]["Enums"]["plan_submission_status"]
        }
        Update: {
          author_user_id?: string
          created_at?: string
          document_id?: string
          id?: string
          lot_id?: string | null
          remarks?: string | null
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          site_id?: string
          status?: Database["public"]["Enums"]["plan_submission_status"]
        }
        Relationships: [
          {
            foreignKeyName: "plan_submissions_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_submissions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_submissions_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_submissions_reviewed_by_user_id_fkey"
            columns: ["reviewed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_submissions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
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
      price_lines: {
        Row: {
          amendment_id: string | null
          code: string
          created_at: string
          id: string
          label: string
          lot_id: string
          origin: Database["public"]["Enums"]["price_line_origin"]
          quantity_market: number
          status: Database["public"]["Enums"]["extraction_status"]
          unit: string
          unit_price_ht: number
          updated_at: string
        }
        Insert: {
          amendment_id?: string | null
          code: string
          created_at?: string
          id?: string
          label: string
          lot_id: string
          origin: Database["public"]["Enums"]["price_line_origin"]
          quantity_market: number
          status?: Database["public"]["Enums"]["extraction_status"]
          unit: string
          unit_price_ht: number
          updated_at?: string
        }
        Update: {
          amendment_id?: string | null
          code?: string
          created_at?: string
          id?: string
          label?: string
          lot_id?: string
          origin?: Database["public"]["Enums"]["price_line_origin"]
          quantity_market?: number
          status?: Database["public"]["Enums"]["extraction_status"]
          unit?: string
          unit_price_ht?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_lines_amendment_id_fkey"
            columns: ["amendment_id"]
            isOneToOne: false
            referencedRelation: "amendments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_lines_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_logs: {
        Row: {
          channel: Database["public"]["Enums"]["reminder_channel"]
          created_by_user_id: string | null
          id: string
          reminder_rule_id: string | null
          sent_at: string
          situation_id: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["reminder_channel"]
          created_by_user_id?: string | null
          id?: string
          reminder_rule_id?: string | null
          sent_at?: string
          situation_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["reminder_channel"]
          created_by_user_id?: string | null
          id?: string
          reminder_rule_id?: string | null
          sent_at?: string
          situation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_logs_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_logs_reminder_rule_id_fkey"
            columns: ["reminder_rule_id"]
            isOneToOne: false
            referencedRelation: "reminder_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_logs_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: false
            referencedRelation: "situations"
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
      reserve_items: {
        Row: {
          created_at: string
          deleted_at: string | null
          deleted_by_user_id: string | null
          deletion_reason: string | null
          description: string
          document_id: string | null
          due_date: string | null
          id: string
          location: string | null
          lot_id: string | null
          photo_url: string | null
          severity: Database["public"]["Enums"]["reserve_severity"]
          site_id: string
          status: Database["public"]["Enums"]["reserve_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          deleted_by_user_id?: string | null
          deletion_reason?: string | null
          description: string
          document_id?: string | null
          due_date?: string | null
          id?: string
          location?: string | null
          lot_id?: string | null
          photo_url?: string | null
          severity: Database["public"]["Enums"]["reserve_severity"]
          site_id: string
          status?: Database["public"]["Enums"]["reserve_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          deleted_by_user_id?: string | null
          deletion_reason?: string | null
          description?: string
          document_id?: string | null
          due_date?: string | null
          id?: string
          location?: string | null
          lot_id?: string | null
          photo_url?: string | null
          severity?: Database["public"]["Enums"]["reserve_severity"]
          site_id?: string
          status?: Database["public"]["Enums"]["reserve_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reserve_items_deleted_by_user_id_fkey"
            columns: ["deleted_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reserve_items_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reserve_items_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reserve_items_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
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
      site_log_entries: {
        Row: {
          author_user_id: string
          created_at: string
          deleted_at: string | null
          deleted_by_user_id: string | null
          deletion_reason: string | null
          description: string
          entry_date: string
          id: string
          kind: Database["public"]["Enums"]["site_log_entry_kind"]
          site_id: string
        }
        Insert: {
          author_user_id: string
          created_at?: string
          deleted_at?: string | null
          deleted_by_user_id?: string | null
          deletion_reason?: string | null
          description: string
          entry_date: string
          id?: string
          kind: Database["public"]["Enums"]["site_log_entry_kind"]
          site_id: string
        }
        Update: {
          author_user_id?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by_user_id?: string | null
          deletion_reason?: string | null
          description?: string
          entry_date?: string
          id?: string
          kind?: Database["public"]["Enums"]["site_log_entry_kind"]
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_log_entries_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_log_entries_deleted_by_user_id_fkey"
            columns: ["deleted_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_log_entries_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_participants: {
        Row: {
          contract_amount_ht: number | null
          id: string
          joined_at: string
          left_at: string | null
          lot_id: string | null
          mission_role: Database["public"]["Enums"]["mission_role"]
          organization_id: string
          site_id: string
        }
        Insert: {
          contract_amount_ht?: number | null
          id?: string
          joined_at?: string
          left_at?: string | null
          lot_id?: string | null
          mission_role: Database["public"]["Enums"]["mission_role"]
          organization_id: string
          site_id: string
        }
        Update: {
          contract_amount_ht?: number | null
          id?: string
          joined_at?: string
          left_at?: string | null
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
          internal_reminder_days: number
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
          internal_reminder_days?: number
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
          internal_reminder_days?: number
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
      situation_allocations: {
        Row: {
          amount_ht: number
          created_at: string
          id: string
          payee_organization_id: string
          situation_id: string
        }
        Insert: {
          amount_ht: number
          created_at?: string
          id?: string
          payee_organization_id: string
          situation_id: string
        }
        Update: {
          amount_ht?: number
          created_at?: string
          id?: string
          payee_organization_id?: string
          situation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "situation_allocations_payee_organization_id_fkey"
            columns: ["payee_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "situation_allocations_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: false
            referencedRelation: "situations"
            referencedColumns: ["id"]
          },
        ]
      }
      situation_lines: {
        Row: {
          amount_ht: number
          id: string
          price_line_id: string
          quantity_month: number
          quantity_previous: number
          situation_id: string
          unit_price_ht: number
        }
        Insert: {
          amount_ht: number
          id?: string
          price_line_id: string
          quantity_month: number
          quantity_previous?: number
          situation_id: string
          unit_price_ht: number
        }
        Update: {
          amount_ht?: number
          id?: string
          price_line_id?: string
          quantity_month?: number
          quantity_previous?: number
          situation_id?: string
          unit_price_ht?: number
        }
        Relationships: [
          {
            foreignKeyName: "situation_lines_price_line_id_fkey"
            columns: ["price_line_id"]
            isOneToOne: false
            referencedRelation: "price_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "situation_lines_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: false
            referencedRelation: "situations"
            referencedColumns: ["id"]
          },
        ]
      }
      situations: {
        Row: {
          actualization_coefficient: number | null
          advance_recovered: number | null
          amount_ht: number
          dispute_reason: string | null
          due_date: string | null
          id: string
          index_month: string | null
          is_final: boolean
          lot_id: string | null
          net_amount_ht: number | null
          number: number
          paid_at: string | null
          penalties_amount: number | null
          retention_amount: number | null
          site_id: string
          status: Database["public"]["Enums"]["payment_status"]
          submitted_at: string | null
        }
        Insert: {
          actualization_coefficient?: number | null
          advance_recovered?: number | null
          amount_ht: number
          dispute_reason?: string | null
          due_date?: string | null
          id?: string
          index_month?: string | null
          is_final?: boolean
          lot_id?: string | null
          net_amount_ht?: number | null
          number: number
          paid_at?: string | null
          penalties_amount?: number | null
          retention_amount?: number | null
          site_id: string
          status: Database["public"]["Enums"]["payment_status"]
          submitted_at?: string | null
        }
        Update: {
          actualization_coefficient?: number | null
          advance_recovered?: number | null
          amount_ht?: number
          dispute_reason?: string | null
          due_date?: string | null
          id?: string
          index_month?: string | null
          is_final?: boolean
          lot_id?: string | null
          net_amount_ht?: number | null
          number?: number
          paid_at?: string | null
          penalties_amount?: number | null
          retention_amount?: number | null
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
      technical_opinions: {
        Row: {
          created_at: string
          created_by_user_id: string
          document_id: string | null
          id: string
          issuer_organization_id: string
          issuer_role: Database["public"]["Enums"]["technical_opinion_issuer_role"]
          kind: Database["public"]["Enums"]["technical_opinion_kind"]
          lot_id: string | null
          site_id: string
          status: Database["public"]["Enums"]["technical_opinion_status"]
          text: string
          verdict:
            | Database["public"]["Enums"]["technical_opinion_verdict"]
            | null
        }
        Insert: {
          created_at?: string
          created_by_user_id: string
          document_id?: string | null
          id?: string
          issuer_organization_id: string
          issuer_role: Database["public"]["Enums"]["technical_opinion_issuer_role"]
          kind: Database["public"]["Enums"]["technical_opinion_kind"]
          lot_id?: string | null
          site_id: string
          status?: Database["public"]["Enums"]["technical_opinion_status"]
          text: string
          verdict?:
            | Database["public"]["Enums"]["technical_opinion_verdict"]
            | null
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          document_id?: string | null
          id?: string
          issuer_organization_id?: string
          issuer_role?: Database["public"]["Enums"]["technical_opinion_issuer_role"]
          kind?: Database["public"]["Enums"]["technical_opinion_kind"]
          lot_id?: string | null
          site_id?: string
          status?: Database["public"]["Enums"]["technical_opinion_status"]
          text?: string
          verdict?:
            | Database["public"]["Enums"]["technical_opinion_verdict"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "technical_opinions_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technical_opinions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technical_opinions_issuer_organization_id_fkey"
            columns: ["issuer_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technical_opinions_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technical_opinions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      template_purchases: {
        Row: {
          id: string
          note: string | null
          organization_id: string
          purchased_at: string
          purchased_by_user_id: string
          source_access_request_id: string | null
          template_catalog_id: string
          version_id: string
        }
        Insert: {
          id?: string
          note?: string | null
          organization_id: string
          purchased_at?: string
          purchased_by_user_id: string
          source_access_request_id?: string | null
          template_catalog_id: string
          version_id: string
        }
        Update: {
          id?: string
          note?: string | null
          organization_id?: string
          purchased_at?: string
          purchased_by_user_id?: string
          source_access_request_id?: string | null
          template_catalog_id?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_purchases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_purchases_purchased_by_user_id_fkey"
            columns: ["purchased_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_purchases_source_access_request_id_fkey"
            columns: ["source_access_request_id"]
            isOneToOne: false
            referencedRelation: "access_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_purchases_template_catalog_id_fkey"
            columns: ["template_catalog_id"]
            isOneToOne: false
            referencedRelation: "document_template_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_purchases_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "template_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      template_versions: {
        Row: {
          changelog: string | null
          created_at: string
          created_by_user_id: string
          file_url: string
          id: string
          requires_expert_review: boolean
          template_catalog_id: string
          variables: string[]
          version_number: number
        }
        Insert: {
          changelog?: string | null
          created_at?: string
          created_by_user_id: string
          file_url: string
          id?: string
          requires_expert_review?: boolean
          template_catalog_id: string
          variables?: string[]
          version_number: number
        }
        Update: {
          changelog?: string | null
          created_at?: string
          created_by_user_id?: string
          file_url?: string
          id?: string
          requires_expert_review?: boolean
          template_catalog_id?: string
          variables?: string[]
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "template_versions_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_versions_template_catalog_id_fkey"
            columns: ["template_catalog_id"]
            isOneToOne: false
            referencedRelation: "document_template_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_codes: {
        Row: {
          code: string
          family: Database["public"]["Enums"]["trade_family"]
          id: string
          label: string
        }
        Insert: {
          code: string
          family: Database["public"]["Enums"]["trade_family"]
          id?: string
          label: string
        }
        Update: {
          code?: string
          family?: Database["public"]["Enums"]["trade_family"]
          id?: string
          label?: string
        }
        Relationships: []
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
          p_access_quota?: number
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
      approve_template_purchase_request: {
        Args: { p_admin_note?: string; p_request_id: string }
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
      check_internal_reminders: { Args: { p_site_id: string }; Returns: number }
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
      find_directory_duplicate: {
        Args: { p_name: string; p_postal_code: string; p_siret: string }
        Returns: string
      }
      get_directory_company_contacts: {
        Args: { p_company_id: string; p_organization_id: string }
        Returns: {
          email: string
          full_name: string
          id: string
          is_primary: boolean
          phone: string
          role: string
        }[]
      }
      get_directory_company_detail: {
        Args: { p_company_id: string; p_organization_id: string }
        Returns: {
          address: string
          city: string
          email: string
          id: string
          notes: string
          phone: string
          postal_code: string
          siret: string
          website: string
        }[]
      }
      get_purchased_template_version: {
        Args: { p_organization_id: string; p_template_catalog_id: string }
        Returns: {
          category: Database["public"]["Enums"]["document_category"]
          file_url: string
          name: string
          requires_expert_review: boolean
          template_catalog_id: string
          variables: string[]
          version_id: string
        }[]
      }
      grant_entitlement: {
        Args: {
          p_access_quota?: number
          p_expires_at?: string
          p_note?: string
          p_organization_id: string
          p_price_id?: string
          p_service_id: string
        }
        Returns: undefined
      }
      has_any_accessible_entitlement: {
        Args: { target_service_code: string }
        Returns: boolean
      }
      has_any_template_purchase: {
        Args: { target_template_catalog_id: string }
        Returns: boolean
      }
      has_entitlement: {
        Args: { target_org_id: string; target_service_code: string }
        Returns: boolean
      }
      has_portfolio_access: {
        Args: { target_org_id: string }
        Returns: boolean
      }
      has_template_purchase: {
        Args: { target_org_id: string; target_template_catalog_id: string }
        Returns: boolean
      }
      has_valid_subcontractor_agreement: {
        Args: { p_organization_id: string; p_site_id: string }
        Returns: boolean
      }
      list_directory_companies_admin: {
        Args: { p_category_id?: string; p_search?: string }
        Returns: {
          address: string | null
          category_id: string
          city: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          siret: string | null
          source_id: string | null
          trade_code_id: string | null
          updated_at: string
          website: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "directory_companies"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      log_act_override: {
        Args: {
          p_act_code: string
          p_organization_id: string
          p_reason: string
          p_site_id: string
        }
        Returns: undefined
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
      request_template_purchase: {
        Args: {
          p_message?: string
          p_organization_id: string
          p_template_catalog_id: string
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
      soft_delete_meeting_note: {
        Args: {
          p_meeting_id: string
          p_organization_id: string
          p_reason: string
        }
        Returns: number
      }
      soft_delete_reserve_item: {
        Args: { p_reason: string; p_reserve_id: string }
        Returns: undefined
      }
      soft_delete_site_log_entry: {
        Args: { p_entry_id: string; p_reason: string }
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
      amendment_status: "BROUILLON" | "VALIDE" | "REFUSE"
      approval_decision: "APPROUVE" | "REFUSE" | "MODIFICATION_DEMANDEE"
      attendee_status: "PRESENT" | "EXCUSE" | "ABSENT"
      audit_actor_type: "USER" | "AUTOMATION" | "AI"
      billing_period: "MONTHLY" | "ANNUAL" | "ONE_TIME"
      credential_kind:
        | "ASSURANCE_RC"
        | "ASSURANCE_DECENNALE"
        | "URSSAF"
        | "QUALIFICATION"
        | "AUTRE"
      credential_status: "VALIDE" | "EXPIRE" | "MANQUANT"
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
        | "AE"
        | "OS"
        | "NOTIFICATION_MARCHE"
        | "CCAP"
        | "CCTP"
        | "DPGF"
        | "BPU"
      document_review_source: "AI" | "HUMAIN"
      document_review_verdict: "OK" | "ECARTS" | "INSUFFISANT"
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
      extraction_status: "EXTRAIT" | "VALIDE" | "REJETE"
      integration_managed_by: "ADMINBTP" | "CLIENT"
      integration_type: "ODOO" | "N8N" | "EMAIL" | "WHATSAPP" | "AI"
      legal_kind:
        | "ENTREPRISE"
        | "MOE"
        | "BET"
        | "AMO_OPC"
        | "PROMOTEUR"
        | "BAILLEUR"
        | "COLLECTIVITE"
        | "ARTISAN"
        | "GROUPE"
      lot_member_role: "MANDATAIRE" | "COTRAITANT" | "TITULAIRE"
      mail_status:
        | "NON_TRAITE"
        | "AFFECTE"
        | "BROUILLON_PRET"
        | "EN_VALIDATION"
        | "REPONDU"
        | "CLOTURE"
      mail_urgency: "NORMALE" | "URGENTE" | "CRITIQUE"
      market_clause_kind:
        | "DELAI_PAIEMENT"
        | "RETENUE_GARANTIE"
        | "ACTUALISATION"
        | "PENALITE"
        | "AVANCE"
        | "AUTRE"
      market_contract_type: "PRIVE" | "PUBLIC"
      meeting_kind: "OPC" | "SYNTHESE" | "RECEPTION"
      meeting_note_distribution_channel: "EMAIL"
      meeting_status: "BROUILLON" | "VALIDE"
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
        | "CT"
        | "SPS"
        | "CSSI"
      organization_size_band: "TPE" | "PME" | "ETI"
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
      plan_submission_status:
        | "DEPOSE"
        | "VISE_BPE"
        | "VISE_AVEC_REMARQUES"
        | "REFUSE"
      price_line_origin: "SAISIE" | "IMPORT_OCR"
      reminder_channel: "EMAIL" | "WHATSAPP" | "COURRIER"
      reserve_severity: "MINEURE" | "MAJEURE" | "BLOQUANTE"
      reserve_status: "OUVERTE" | "LEVEE" | "CONTESTEE"
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
      site_log_entry_kind:
        | "INTEMPERIE"
        | "ARRET"
        | "LIVRAISON"
        | "INCIDENT"
        | "AUTRE"
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
        | "MEETING"
      task_status: "A_FAIRE" | "EN_COURS" | "EN_ATTENTE" | "FAIT" | "ANNULE"
      technical_opinion_issuer_role: "CT" | "SPS" | "BET" | "CSSI"
      technical_opinion_kind: "AVIS" | "VISITE" | "OBSERVATION"
      technical_opinion_status: "BROUILLON" | "EMIS"
      technical_opinion_verdict:
        | "FAVORABLE"
        | "FAVORABLE_AVEC_OBSERVATIONS"
        | "SUSPENDU"
        | "DEFAVORABLE"
      trade_family:
        | "STRUCTURE_VRD"
        | "TECHNIQUE"
        | "ETANCHEITE_FACADE"
        | "FINITIONS"
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
      amendment_status: ["BROUILLON", "VALIDE", "REFUSE"],
      approval_decision: ["APPROUVE", "REFUSE", "MODIFICATION_DEMANDEE"],
      attendee_status: ["PRESENT", "EXCUSE", "ABSENT"],
      audit_actor_type: ["USER", "AUTOMATION", "AI"],
      billing_period: ["MONTHLY", "ANNUAL", "ONE_TIME"],
      credential_kind: [
        "ASSURANCE_RC",
        "ASSURANCE_DECENNALE",
        "URSSAF",
        "QUALIFICATION",
        "AUTRE",
      ],
      credential_status: ["VALIDE", "EXPIRE", "MANQUANT"],
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
        "AE",
        "OS",
        "NOTIFICATION_MARCHE",
        "CCAP",
        "CCTP",
        "DPGF",
        "BPU",
      ],
      document_review_source: ["AI", "HUMAIN"],
      document_review_verdict: ["OK", "ECARTS", "INSUFFISANT"],
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
      extraction_status: ["EXTRAIT", "VALIDE", "REJETE"],
      integration_managed_by: ["ADMINBTP", "CLIENT"],
      integration_type: ["ODOO", "N8N", "EMAIL", "WHATSAPP", "AI"],
      legal_kind: [
        "ENTREPRISE",
        "MOE",
        "BET",
        "AMO_OPC",
        "PROMOTEUR",
        "BAILLEUR",
        "COLLECTIVITE",
        "ARTISAN",
        "GROUPE",
      ],
      lot_member_role: ["MANDATAIRE", "COTRAITANT", "TITULAIRE"],
      mail_status: [
        "NON_TRAITE",
        "AFFECTE",
        "BROUILLON_PRET",
        "EN_VALIDATION",
        "REPONDU",
        "CLOTURE",
      ],
      mail_urgency: ["NORMALE", "URGENTE", "CRITIQUE"],
      market_clause_kind: [
        "DELAI_PAIEMENT",
        "RETENUE_GARANTIE",
        "ACTUALISATION",
        "PENALITE",
        "AVANCE",
        "AUTRE",
      ],
      market_contract_type: ["PRIVE", "PUBLIC"],
      meeting_kind: ["OPC", "SYNTHESE", "RECEPTION"],
      meeting_note_distribution_channel: ["EMAIL"],
      meeting_status: ["BROUILLON", "VALIDE"],
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
        "CT",
        "SPS",
        "CSSI",
      ],
      organization_size_band: ["TPE", "PME", "ETI"],
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
      plan_submission_status: [
        "DEPOSE",
        "VISE_BPE",
        "VISE_AVEC_REMARQUES",
        "REFUSE",
      ],
      price_line_origin: ["SAISIE", "IMPORT_OCR"],
      reminder_channel: ["EMAIL", "WHATSAPP", "COURRIER"],
      reserve_severity: ["MINEURE", "MAJEURE", "BLOQUANTE"],
      reserve_status: ["OUVERTE", "LEVEE", "CONTESTEE"],
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
      site_log_entry_kind: [
        "INTEMPERIE",
        "ARRET",
        "LIVRAISON",
        "INCIDENT",
        "AUTRE",
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
        "MEETING",
      ],
      task_status: ["A_FAIRE", "EN_COURS", "EN_ATTENTE", "FAIT", "ANNULE"],
      technical_opinion_issuer_role: ["CT", "SPS", "BET", "CSSI"],
      technical_opinion_kind: ["AVIS", "VISITE", "OBSERVATION"],
      technical_opinion_status: ["BROUILLON", "EMIS"],
      technical_opinion_verdict: [
        "FAVORABLE",
        "FAVORABLE_AVEC_OBSERVATIONS",
        "SUSPENDU",
        "DEFAVORABLE",
      ],
      trade_family: [
        "STRUCTURE_VRD",
        "TECHNIQUE",
        "ETANCHEITE_FACADE",
        "FINITIONS",
      ],
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
