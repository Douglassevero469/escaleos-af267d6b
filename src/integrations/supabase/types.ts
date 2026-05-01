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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      briefings: {
        Row: {
          client_id: string
          created_at: string
          data: Json
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          data?: Json
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          data?: Json
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "briefings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_contracts: {
        Row: {
          client_id: string | null
          client_name: string | null
          created_at: string
          id: string
          monthly_fee: number
          notes: string | null
          payment_day: number | null
          renewal_date: string | null
          responsible: string | null
          start_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          id?: string
          monthly_fee?: number
          notes?: string | null
          payment_day?: number | null
          renewal_date?: string | null
          responsible?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          id?: string
          monthly_fee?: number
          notes?: string | null
          payment_day?: number | null
          renewal_date?: string | null
          responsible?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_services: {
        Row: {
          active: boolean
          contract_id: string
          created_at: string
          description: string | null
          id: string
          scope: string | null
          service_type: string
          user_id: string
        }
        Insert: {
          active?: boolean
          contract_id: string
          created_at?: string
          description?: string | null
          id?: string
          scope?: string | null
          service_type: string
          user_id: string
        }
        Update: {
          active?: boolean
          contract_id?: string
          created_at?: string
          description?: string | null
          id?: string
          scope?: string | null
          service_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_services_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "client_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          id: string
          instagram: string | null
          name: string
          nicho: string | null
          site: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instagram?: string | null
          name: string
          nicho?: string | null
          site?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instagram?: string | null
          name?: string
          nicho?: string | null
          site?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_activities: {
        Row: {
          content: string | null
          created_at: string
          details: Json | null
          id: string
          lead_id: string
          type: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          lead_id: string
          type?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          lead_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          company: string | null
          created_at: string
          custom_fields: Json
          email: string | null
          form_id: string | null
          form_submission_id: string | null
          id: string
          lost_at: string | null
          name: string
          next_action_date: string | null
          next_action_notes: string | null
          next_action_type: string | null
          notes: string | null
          phone: string | null
          pipeline_id: string
          position: number
          score: number
          stage: string
          tags: Json
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          company?: string | null
          created_at?: string
          custom_fields?: Json
          email?: string | null
          form_id?: string | null
          form_submission_id?: string | null
          id?: string
          lost_at?: string | null
          name?: string
          next_action_date?: string | null
          next_action_notes?: string | null
          next_action_type?: string | null
          notes?: string | null
          phone?: string | null
          pipeline_id: string
          position?: number
          score?: number
          stage?: string
          tags?: Json
          updated_at?: string
          user_id: string
          value?: number
        }
        Update: {
          company?: string | null
          created_at?: string
          custom_fields?: Json
          email?: string | null
          form_id?: string | null
          form_submission_id?: string | null
          id?: string
          lost_at?: string | null
          name?: string
          next_action_date?: string | null
          next_action_notes?: string | null
          next_action_type?: string | null
          notes?: string | null
          phone?: string | null
          pipeline_id?: string
          position?: number
          score?: number
          stage?: string
          tags?: Json
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_form_submission_id_fkey"
            columns: ["form_submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipelines: {
        Row: {
          created_at: string
          id: string
          name: string
          stages: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          stages?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          stages?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      demand_activity_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_activity_log_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "demand_items"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_attachments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "demand_items"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_boards: {
        Row: {
          columns: Json
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          columns?: Json
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          columns?: Json
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      demand_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_comments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "demand_items"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_items: {
        Row: {
          assignee_name: string | null
          board_id: string
          color: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          position: number
          priority: string
          start_date: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assignee_name?: string | null
          board_id: string
          color?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          priority?: string
          start_date?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assignee_name?: string | null
          board_id?: string
          color?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          priority?: string
          start_date?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_items_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "demand_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_subtasks: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          item_id: string
          position: number
          title: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          item_id: string
          position?: number
          title: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          item_id?: string
          position?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_subtasks_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "demand_items"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          priority: string
          subtasks: Json
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          priority?: string
          subtasks?: Json
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          priority?: string
          subtasks?: Json
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: string | null
          created_at: string
          doc_type: string
          id: string
          package_id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          doc_type: string
          id?: string
          package_id: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          doc_type?: string
          id?: string
          package_id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          kind: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          kind?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          kind?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      finance_generation_runs: {
        Row: {
          created_at: string
          details: Json
          expenses_count: number
          finished_at: string | null
          id: string
          message: string | null
          mode: string
          month: string
          payroll_count: number
          revenues_count: number
          started_at: string
          status: string
          total_amount: number
          total_deleted: number
          total_inserted: number
          trigger: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: Json
          expenses_count?: number
          finished_at?: string | null
          id?: string
          message?: string | null
          mode?: string
          month: string
          payroll_count?: number
          revenues_count?: number
          started_at?: string
          status?: string
          total_amount?: number
          total_deleted?: number
          total_inserted?: number
          trigger?: string
          user_id: string
        }
        Update: {
          created_at?: string
          details?: Json
          expenses_count?: number
          finished_at?: string | null
          id?: string
          message?: string | null
          mode?: string
          month?: string
          payroll_count?: number
          revenues_count?: number
          started_at?: string
          status?: string
          total_amount?: number
          total_deleted?: number
          total_inserted?: number
          trigger?: string
          user_id?: string
        }
        Relationships: []
      }
      finance_recurring_expenses: {
        Row: {
          active: boolean
          amount: number
          category_id: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          payment_day: number | null
          start_date: string | null
          updated_at: string
          user_id: string
          vendor: string | null
        }
        Insert: {
          active?: boolean
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          payment_day?: number | null
          start_date?: string | null
          updated_at?: string
          user_id: string
          vendor?: string | null
        }
        Update: {
          active?: boolean
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          payment_day?: number | null
          start_date?: string | null
          updated_at?: string
          user_id?: string
          vendor?: string | null
        }
        Relationships: []
      }
      finance_recurring_revenues: {
        Row: {
          amount: number
          category_id: string | null
          client_name: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          linked_contract_id: string | null
          payment_day: number | null
          start_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          category_id?: string | null
          client_name: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          linked_contract_id?: string | null
          payment_day?: number | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          client_name?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          linked_contract_id?: string | null
          payment_day?: number | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      finance_team_members: {
        Row: {
          compensation_type: string
          created_at: string
          id: string
          manager_id: string | null
          monthly_cost: number
          name: string | null
          notes: string | null
          role: string
          start_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          compensation_type?: string
          created_at?: string
          id?: string
          manager_id?: string | null
          monthly_cost?: number
          name?: string | null
          notes?: string | null
          role: string
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          compensation_type?: string
          created_at?: string
          id?: string
          manager_id?: string | null
          monthly_cost?: number
          name?: string | null
          notes?: string | null
          role?: string
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_team_members_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "finance_team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_transactions: {
        Row: {
          amount: number
          attachment_url: string | null
          category_id: string | null
          created_at: string
          description: string
          due_date: string
          id: string
          kind: string
          notes: string | null
          paid_date: string | null
          payment_method: string | null
          reference_id: string | null
          reference_type: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          attachment_url?: string | null
          category_id?: string | null
          created_at?: string
          description: string
          due_date: string
          id?: string
          kind: string
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          attachment_url?: string | null
          category_id?: string | null
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          kind?: string
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      form_events: {
        Row: {
          created_at: string
          event_type: string
          form_id: string
          id: string
          metadata: Json | null
          session_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          form_id: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          form_id?: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_events_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          created_at: string
          data: Json
          form_id: string
          id: string
          ip_address: string | null
          metadata: Json | null
          notes: string | null
          status: string
          tags: string[] | null
        }
        Insert: {
          created_at?: string
          data?: Json
          form_id: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          notes?: string | null
          status?: string
          tags?: string[] | null
        }
        Update: {
          created_at?: string
          data?: Json
          form_id?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          notes?: string | null
          status?: string
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          created_at: string
          description: string | null
          fields: Json
          id: string
          layout: string
          name: string
          settings: Json
          slug: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          fields?: Json
          id?: string
          layout?: string
          name: string
          settings?: Json
          slug: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          fields?: Json
          id?: string
          layout?: string
          name?: string
          settings?: Json
          slug?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      generation_logs: {
        Row: {
          action: string
          created_at: string
          doc_type: string
          document_id: string
          id: string
          token_estimate: number
          user_id: string
          word_count: number
        }
        Insert: {
          action?: string
          created_at?: string
          doc_type: string
          document_id: string
          id?: string
          token_estimate?: number
          user_id: string
          word_count?: number
        }
        Update: {
          action?: string
          created_at?: string
          doc_type?: string
          document_id?: string
          id?: string
          token_estimate?: number
          user_id?: string
          word_count?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      packages: {
        Row: {
          briefing_id: string
          client_id: string
          created_at: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          briefing_id: string
          client_id: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          briefing_id?: string
          client_id?: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "packages_briefing_id_fkey"
            columns: ["briefing_id"]
            isOneToOne: false
            referencedRelation: "briefings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          briefing_data: Json
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          briefing_data?: Json
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          briefing_data?: Json
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_get_all_users: {
        Args: never
        Returns: {
          avatar_url: string
          created_at: string
          display_name: string
          email: string
          last_sign_in_at: string
          role: string
          total_documents: number
          total_packages: number
          total_tokens: number
          total_words: number
          user_id: string
        }[]
      }
      admin_get_audit_logs: {
        Args: {
          _entity_type?: string
          _limit?: number
          _offset?: number
          _status?: string
        }
        Returns: {
          action: string
          created_at: string
          details: Json
          entity_id: string
          entity_type: string
          id: string
          status: string
          user_email: string
          user_id: string
          user_name: string
        }[]
      }
      admin_get_stats: {
        Args: never
        Returns: {
          generations_today: number
          total_documents: number
          total_packages: number
          total_tokens: number
          total_users: number
        }[]
      }
      admin_set_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _target_user_id: string
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
