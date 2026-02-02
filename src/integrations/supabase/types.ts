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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_activity_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_notes: {
        Row: {
          category: Database["public"]["Enums"]["note_category"]
          content: string | null
          created_at: string
          id: string
          priority: number | null
          related_project_id: string | null
          status: Database["public"]["Enums"]["note_status"] | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["note_category"]
          content?: string | null
          created_at?: string
          id?: string
          priority?: number | null
          related_project_id?: string | null
          status?: Database["public"]["Enums"]["note_status"] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["note_category"]
          content?: string | null
          created_at?: string
          id?: string
          priority?: number | null
          related_project_id?: string | null
          status?: Database["public"]["Enums"]["note_status"] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notes_related_project_id_fkey"
            columns: ["related_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          admin_notes: string | null
          category: Database["public"]["Enums"]["writing_category"]
          content: string | null
          created_at: string
          draft_content: Json | null
          excerpt: string | null
          featured_image: string | null
          id: string
          last_saved_draft: string | null
          next_steps: string | null
          published: boolean | null
          reading_time_minutes: number | null
          review_status:
            | Database["public"]["Enums"]["content_review_status"]
            | null
          reviewer_notes: string | null
          scheduled_at: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          category: Database["public"]["Enums"]["writing_category"]
          content?: string | null
          created_at?: string
          draft_content?: Json | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          last_saved_draft?: string | null
          next_steps?: string | null
          published?: boolean | null
          reading_time_minutes?: number | null
          review_status?:
            | Database["public"]["Enums"]["content_review_status"]
            | null
          reviewer_notes?: string | null
          scheduled_at?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          category?: Database["public"]["Enums"]["writing_category"]
          content?: string | null
          created_at?: string
          draft_content?: Json | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          last_saved_draft?: string | null
          next_steps?: string | null
          published?: boolean | null
          reading_time_minutes?: number | null
          review_status?:
            | Database["public"]["Enums"]["content_review_status"]
            | null
          reviewer_notes?: string | null
          scheduled_at?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      artwork: {
        Row: {
          admin_notes: string | null
          category: string | null
          created_at: string
          description: string | null
          draft_content: Json | null
          id: string
          image_url: string
          title: string
        }
        Insert: {
          admin_notes?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          draft_content?: Json | null
          id?: string
          image_url: string
          title: string
        }
        Update: {
          admin_notes?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          draft_content?: Json | null
          id?: string
          image_url?: string
          title?: string
        }
        Relationships: []
      }
      client_projects: {
        Row: {
          client_name: string
          created_at: string | null
          description: string | null
          end_date: string | null
          features: string[] | null
          id: string
          image_url: string | null
          is_public: boolean | null
          long_description: string | null
          project_name: string
          screenshots: string[] | null
          slug: string
          start_date: string | null
          status: string
          tech_stack: string[] | null
          testimonial: string | null
          testimonial_author: string | null
          updated_at: string | null
        }
        Insert: {
          client_name: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          features?: string[] | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          long_description?: string | null
          project_name: string
          screenshots?: string[] | null
          slug: string
          start_date?: string | null
          status?: string
          tech_stack?: string[] | null
          testimonial?: string | null
          testimonial_author?: string | null
          updated_at?: string | null
        }
        Update: {
          client_name?: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          features?: string[] | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          long_description?: string | null
          project_name?: string
          screenshots?: string[] | null
          slug?: string
          start_date?: string | null
          status?: string
          tech_stack?: string[] | null
          testimonial?: string | null
          testimonial_author?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contributions: {
        Row: {
          amount: number
          contribution_type: string
          created_at: string
          id: string
          message: string | null
          show_publicly: boolean | null
          stripe_payment_id: string | null
          target_id: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          contribution_type: string
          created_at?: string
          id?: string
          message?: string | null
          show_publicly?: boolean | null
          stripe_payment_id?: string | null
          target_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          contribution_type?: string
          created_at?: string
          id?: string
          message?: string | null
          show_publicly?: boolean | null
          stripe_payment_id?: string | null
          target_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      experiments: {
        Row: {
          admin_notes: string | null
          average_rating: number | null
          case_study: string | null
          cost_breakdown: Json | null
          costs: number | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          image_url: string | null
          lessons_learned: string[] | null
          long_description: string | null
          management_info: string | null
          name: string
          operation_details: string | null
          platform: string
          products_offered: string[] | null
          products_sold: number | null
          profit: number | null
          revenue: number | null
          review_count: number | null
          review_status:
            | Database["public"]["Enums"]["content_review_status"]
            | null
          reviewer_notes: string | null
          sample_reviews: string[] | null
          scheduled_at: string | null
          screenshots: string[] | null
          skills_demonstrated: string[] | null
          slug: string
          start_date: string | null
          status: string
          total_orders: number | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          average_rating?: number | null
          case_study?: string | null
          cost_breakdown?: Json | null
          costs?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          lessons_learned?: string[] | null
          long_description?: string | null
          management_info?: string | null
          name: string
          operation_details?: string | null
          platform: string
          products_offered?: string[] | null
          products_sold?: number | null
          profit?: number | null
          revenue?: number | null
          review_count?: number | null
          review_status?:
            | Database["public"]["Enums"]["content_review_status"]
            | null
          reviewer_notes?: string | null
          sample_reviews?: string[] | null
          scheduled_at?: string | null
          screenshots?: string[] | null
          skills_demonstrated?: string[] | null
          slug: string
          start_date?: string | null
          status?: string
          total_orders?: number | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          average_rating?: number | null
          case_study?: string | null
          cost_breakdown?: Json | null
          costs?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          lessons_learned?: string[] | null
          long_description?: string | null
          management_info?: string | null
          name?: string
          operation_details?: string | null
          platform?: string
          products_offered?: string[] | null
          products_sold?: number | null
          profit?: number | null
          revenue?: number | null
          review_count?: number | null
          review_status?:
            | Database["public"]["Enums"]["content_review_status"]
            | null
          reviewer_notes?: string | null
          sample_reviews?: string[] | null
          scheduled_at?: string | null
          screenshots?: string[] | null
          skills_demonstrated?: string[] | null
          slug?: string
          start_date?: string | null
          status?: string
          total_orders?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string | null
          creator_location: string | null
          creator_name: string | null
          creator_url: string | null
          description: string | null
          discovered_date: string | null
          id: string
          image_url: string | null
          impact_statement: string | null
          is_current: boolean | null
          source_url: string | null
          tags: string[] | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          creator_location?: string | null
          creator_name?: string | null
          creator_url?: string | null
          description?: string | null
          discovered_date?: string | null
          id?: string
          image_url?: string | null
          impact_statement?: string | null
          is_current?: boolean | null
          source_url?: string | null
          tags?: string[] | null
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          creator_location?: string | null
          creator_name?: string | null
          creator_url?: string | null
          description?: string | null
          discovered_date?: string | null
          id?: string
          image_url?: string | null
          impact_statement?: string | null
          is_current?: boolean | null
          source_url?: string | null
          tags?: string[] | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      funding_campaigns: {
        Row: {
          campaign_type: string
          created_at: string
          description: string | null
          id: string
          project_id: string | null
          raised_amount: number
          status: string
          target_amount: number
          title: string
          updated_at: string
        }
        Insert: {
          campaign_type: string
          created_at?: string
          description?: string | null
          id?: string
          project_id?: string | null
          raised_amount?: number
          status?: string
          target_amount?: number
          title: string
          updated_at?: string
        }
        Update: {
          campaign_type?: string
          created_at?: string
          description?: string | null
          id?: string
          project_id?: string | null
          raised_amount?: number
          status?: string
          target_amount?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funding_campaigns_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      inspirations: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          detailed_content: string | null
          id: string
          image_url: string | null
          influence_areas: string[] | null
          order_index: number | null
          related_links: Json | null
          title: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          detailed_content?: string | null
          id?: string
          image_url?: string | null
          influence_areas?: string[] | null
          order_index?: number | null
          related_links?: Json | null
          title: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          detailed_content?: string | null
          id?: string
          image_url?: string | null
          influence_areas?: string[] | null
          order_index?: number | null
          related_links?: Json | null
          title?: string
        }
        Relationships: []
      }
      lead_plans: {
        Row: {
          ai_suggestions: Json | null
          created_at: string | null
          description: string | null
          estimated_cost: number | null
          estimated_hours: number | null
          id: string
          lead_id: string | null
          status: string | null
          steps: Json | null
          timeline: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ai_suggestions?: Json | null
          created_at?: string | null
          description?: string | null
          estimated_cost?: number | null
          estimated_hours?: number | null
          id?: string
          lead_id?: string | null
          status?: string | null
          steps?: Json | null
          timeline?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ai_suggestions?: Json | null
          created_at?: string | null
          description?: string | null
          estimated_cost?: number | null
          estimated_hours?: number | null
          id?: string
          lead_id?: string | null
          status?: string | null
          steps?: Json | null
          timeline?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_plans_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_searches: {
        Row: {
          executed_at: string
          filters: Json | null
          id: string
          results_count: number | null
          search_query: string | null
          status: Database["public"]["Enums"]["search_status"] | null
        }
        Insert: {
          executed_at?: string
          filters?: Json | null
          id?: string
          results_count?: number | null
          search_query?: string | null
          status?: Database["public"]["Enums"]["search_status"] | null
        }
        Update: {
          executed_at?: string
          filters?: Json | null
          id?: string
          results_count?: number | null
          search_query?: string | null
          status?: Database["public"]["Enums"]["search_status"] | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          accepted_at: string | null
          benefits: string[] | null
          company: string | null
          company_size: string | null
          contact_person: string | null
          contact_title: string | null
          created_at: string
          email: string | null
          estimated_pay: number | null
          id: string
          industry: string | null
          is_accepted: boolean | null
          last_contacted: string | null
          lead_type: string | null
          linkedin: string | null
          location: string | null
          match_reasons: string[] | null
          match_score: number | null
          name: string | null
          notes: string | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"] | null
          suggested_services: string[] | null
          updated_at: string
          website: string | null
          work_description: string | null
        }
        Insert: {
          accepted_at?: string | null
          benefits?: string[] | null
          company?: string | null
          company_size?: string | null
          contact_person?: string | null
          contact_title?: string | null
          created_at?: string
          email?: string | null
          estimated_pay?: number | null
          id?: string
          industry?: string | null
          is_accepted?: boolean | null
          last_contacted?: string | null
          lead_type?: string | null
          linkedin?: string | null
          location?: string | null
          match_reasons?: string[] | null
          match_score?: number | null
          name?: string | null
          notes?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          suggested_services?: string[] | null
          updated_at?: string
          website?: string | null
          work_description?: string | null
        }
        Update: {
          accepted_at?: string | null
          benefits?: string[] | null
          company?: string | null
          company_size?: string | null
          contact_person?: string | null
          contact_title?: string | null
          created_at?: string
          email?: string | null
          estimated_pay?: number | null
          id?: string
          industry?: string | null
          is_accepted?: boolean | null
          last_contacted?: string | null
          lead_type?: string | null
          linkedin?: string | null
          location?: string | null
          match_reasons?: string[] | null
          match_score?: number | null
          name?: string | null
          notes?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          suggested_services?: string[] | null
          updated_at?: string
          website?: string | null
          work_description?: string | null
        }
        Relationships: []
      }
      learning_goals: {
        Row: {
          created_at: string
          description: string | null
          id: string
          progress_percent: number | null
          raised_amount: number | null
          target_amount: number | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          progress_percent?: number | null
          raised_amount?: number | null
          target_amount?: number | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          progress_percent?: number | null
          raised_amount?: number | null
          target_amount?: number | null
          title?: string
        }
        Relationships: []
      }
      life_periods: {
        Row: {
          created_at: string | null
          description: string | null
          detailed_content: string | null
          end_date: string | null
          id: string
          image_url: string | null
          is_current: boolean | null
          key_works: string[] | null
          order_index: number | null
          start_date: string
          themes: string[] | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          detailed_content?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_current?: boolean | null
          key_works?: string[] | null
          order_index?: number | null
          start_date: string
          themes?: string[] | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          detailed_content?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_current?: boolean | null
          key_works?: string[] | null
          order_index?: number | null
          start_date?: string
          themes?: string[] | null
          title?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          likeable_id: string
          likeable_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          likeable_id: string
          likeable_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          likeable_id?: string
          likeable_type?: string
          user_id?: string
        }
        Relationships: []
      }
      link_clicks: {
        Row: {
          id: string
          link_text: string | null
          link_url: string
          page_path: string
          session_id: string
          timestamp: string
          visitor_id: string
        }
        Insert: {
          id?: string
          link_text?: string | null
          link_url: string
          page_path: string
          session_id: string
          timestamp?: string
          visitor_id: string
        }
        Update: {
          id?: string
          link_text?: string | null
          link_url?: string
          page_path?: string
          session_id?: string
          timestamp?: string
          visitor_id?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          city: string | null
          country: string | null
          device_type: string | null
          id: string
          page_path: string
          referrer: string | null
          screen_size: string | null
          session_id: string
          time_on_page_seconds: number | null
          timestamp: string
          user_agent: string | null
          visitor_id: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          device_type?: string | null
          id?: string
          page_path: string
          referrer?: string | null
          screen_size?: string | null
          session_id: string
          time_on_page_seconds?: number | null
          timestamp?: string
          user_agent?: string | null
          visitor_id: string
        }
        Update: {
          city?: string | null
          country?: string | null
          device_type?: string | null
          id?: string
          page_path?: string
          referrer?: string | null
          screen_size?: string | null
          session_id?: string
          time_on_page_seconds?: number | null
          timestamp?: string
          user_agent?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          admin_notes: string | null
          category: string
          company: string
          competitor_comparison: Json | null
          content: string | null
          created_at: string
          featured_image: string | null
          future_recommendations: string[] | null
          id: string
          improvement_suggestions: string[] | null
          overall_rating: number | null
          pain_points: string[] | null
          product_name: string
          published: boolean | null
          review_status:
            | Database["public"]["Enums"]["content_review_status"]
            | null
          reviewer_notes: string | null
          scheduled_at: string | null
          screenshots: string[] | null
          slug: string
          strengths: string[] | null
          summary: string | null
          technical_issues: string[] | null
          updated_at: string
          user_complaints: Json | null
          user_experience_analysis: Json | null
        }
        Insert: {
          admin_notes?: string | null
          category?: string
          company: string
          competitor_comparison?: Json | null
          content?: string | null
          created_at?: string
          featured_image?: string | null
          future_recommendations?: string[] | null
          id?: string
          improvement_suggestions?: string[] | null
          overall_rating?: number | null
          pain_points?: string[] | null
          product_name: string
          published?: boolean | null
          review_status?:
            | Database["public"]["Enums"]["content_review_status"]
            | null
          reviewer_notes?: string | null
          scheduled_at?: string | null
          screenshots?: string[] | null
          slug: string
          strengths?: string[] | null
          summary?: string | null
          technical_issues?: string[] | null
          updated_at?: string
          user_complaints?: Json | null
          user_experience_analysis?: Json | null
        }
        Update: {
          admin_notes?: string | null
          category?: string
          company?: string
          competitor_comparison?: Json | null
          content?: string | null
          created_at?: string
          featured_image?: string | null
          future_recommendations?: string[] | null
          id?: string
          improvement_suggestions?: string[] | null
          overall_rating?: number | null
          pain_points?: string[] | null
          product_name?: string
          published?: boolean | null
          review_status?:
            | Database["public"]["Enums"]["content_review_status"]
            | null
          reviewer_notes?: string | null
          scheduled_at?: string | null
          screenshots?: string[] | null
          slug?: string
          strengths?: string[] | null
          summary?: string | null
          technical_issues?: string[] | null
          updated_at?: string
          user_complaints?: Json | null
          user_experience_analysis?: Json | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          compare_at_price: number | null
          created_at: string | null
          description: string | null
          id: string
          images: string[] | null
          inventory_count: number | null
          long_description: string | null
          name: string
          price: number
          shopify_product_id: string | null
          shopify_variant_id: string | null
          slug: string
          status: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          compare_at_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          inventory_count?: number | null
          long_description?: string | null
          name: string
          price?: number
          shopify_product_id?: string | null
          shopify_variant_id?: string | null
          slug: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          compare_at_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          inventory_count?: number | null
          long_description?: string | null
          name?: string
          price?: number
          shopify_product_id?: string | null
          shopify_variant_id?: string | null
          slug?: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          show_on_thank_you_wall: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          show_on_thank_you_wall?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          show_on_thank_you_wall?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          accessibility_notes: string | null
          admin_notes: string | null
          architecture_notes: string | null
          case_study: string | null
          color_palette: string[] | null
          cost_breakdown: Json | null
          created_at: string
          description: string | null
          draft_content: Json | null
          external_url: string | null
          features: string[] | null
          funding_goal: number | null
          funding_raised: number | null
          github_stats: Json | null
          github_url: string | null
          id: string
          image_url: string | null
          last_saved_draft: string | null
          logo_url: string | null
          long_description: string | null
          money_needed: number | null
          money_spent: number | null
          next_steps: string | null
          performance_notes: string | null
          problem_statement: string | null
          results_metrics: Json | null
          review_status:
            | Database["public"]["Enums"]["content_review_status"]
            | null
          reviewer_notes: string | null
          scheduled_at: string | null
          screenshots: string[] | null
          slug: string
          solution_summary: string | null
          status: Database["public"]["Enums"]["project_status"]
          tech_stack: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          accessibility_notes?: string | null
          admin_notes?: string | null
          architecture_notes?: string | null
          case_study?: string | null
          color_palette?: string[] | null
          cost_breakdown?: Json | null
          created_at?: string
          description?: string | null
          draft_content?: Json | null
          external_url?: string | null
          features?: string[] | null
          funding_goal?: number | null
          funding_raised?: number | null
          github_stats?: Json | null
          github_url?: string | null
          id?: string
          image_url?: string | null
          last_saved_draft?: string | null
          logo_url?: string | null
          long_description?: string | null
          money_needed?: number | null
          money_spent?: number | null
          next_steps?: string | null
          performance_notes?: string | null
          problem_statement?: string | null
          results_metrics?: Json | null
          review_status?:
            | Database["public"]["Enums"]["content_review_status"]
            | null
          reviewer_notes?: string | null
          scheduled_at?: string | null
          screenshots?: string[] | null
          slug: string
          solution_summary?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          tech_stack?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          accessibility_notes?: string | null
          admin_notes?: string | null
          architecture_notes?: string | null
          case_study?: string | null
          color_palette?: string[] | null
          cost_breakdown?: Json | null
          created_at?: string
          description?: string | null
          draft_content?: Json | null
          external_url?: string | null
          features?: string[] | null
          funding_goal?: number | null
          funding_raised?: number | null
          github_stats?: Json | null
          github_url?: string | null
          id?: string
          image_url?: string | null
          last_saved_draft?: string | null
          logo_url?: string | null
          long_description?: string | null
          money_needed?: number | null
          money_spent?: number | null
          next_steps?: string | null
          performance_notes?: string | null
          problem_statement?: string | null
          results_metrics?: Json | null
          review_status?:
            | Database["public"]["Enums"]["content_review_status"]
            | null
          reviewer_notes?: string | null
          scheduled_at?: string | null
          screenshots?: string[] | null
          slug?: string
          solution_summary?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          tech_stack?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales_data: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          id: string
          notes: string | null
          period: string
          units_sold: number | null
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string | null
          id?: string
          notes?: string | null
          period: string
          units_sold?: number | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          period?: string
          units_sold?: number | null
        }
        Relationships: []
      }
      sessions: {
        Row: {
          city: string | null
          country: string | null
          ended_at: string | null
          entry_page: string | null
          exit_page: string | null
          id: string
          pages_viewed: number | null
          started_at: string
          visitor_id: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          ended_at?: string | null
          entry_page?: string | null
          exit_page?: string | null
          id: string
          pages_viewed?: number | null
          started_at?: string
          visitor_id: string
        }
        Update: {
          city?: string | null
          country?: string | null
          ended_at?: string | null
          entry_page?: string | null
          exit_page?: string | null
          id?: string
          pages_viewed?: number | null
          started_at?: string
          visitor_id?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content_type: Database["public"]["Enums"]["content_type"]
          content_value: string | null
          draft_value: string | null
          id: string
          is_draft: boolean | null
          notes: string | null
          section_key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content_type?: Database["public"]["Enums"]["content_type"]
          content_value?: string | null
          draft_value?: string | null
          id?: string
          is_draft?: boolean | null
          notes?: string | null
          section_key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content_type?: Database["public"]["Enums"]["content_type"]
          content_value?: string | null
          draft_value?: string | null
          id?: string
          is_draft?: boolean | null
          notes?: string | null
          section_key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      skills: {
        Row: {
          category: string
          created_at: string
          icon_name: string | null
          id: string
          name: string
          proficiency: number | null
        }
        Insert: {
          category: string
          created_at?: string
          icon_name?: string | null
          id?: string
          name: string
          proficiency?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          icon_name?: string | null
          id?: string
          name?: string
          proficiency?: number | null
        }
        Relationships: []
      }
      supplies_needed: {
        Row: {
          category: string
          created_at: string
          description: string | null
          funded_amount: number
          id: string
          image_url: string | null
          name: string
          price: number
          priority: string
          product_url: string | null
          status: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          funded_amount?: number
          id?: string
          image_url?: string | null
          name: string
          price?: number
          priority?: string
          product_url?: string | null
          status?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          funded_amount?: number
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          priority?: string
          product_url?: string | null
          status?: string
        }
        Relationships: []
      }
      updates: {
        Row: {
          admin_notes: string | null
          content: string | null
          created_at: string
          draft_content: Json | null
          excerpt: string | null
          id: string
          last_saved_draft: string | null
          next_steps: string | null
          published: boolean | null
          review_status:
            | Database["public"]["Enums"]["content_review_status"]
            | null
          reviewer_notes: string | null
          scheduled_at: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          content?: string | null
          created_at?: string
          draft_content?: Json | null
          excerpt?: string | null
          id?: string
          last_saved_draft?: string | null
          next_steps?: string | null
          published?: boolean | null
          review_status?:
            | Database["public"]["Enums"]["content_review_status"]
            | null
          reviewer_notes?: string | null
          scheduled_at?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          content?: string | null
          created_at?: string
          draft_content?: Json | null
          excerpt?: string | null
          id?: string
          last_saved_draft?: string | null
          next_steps?: string | null
          published?: boolean | null
          review_status?:
            | Database["public"]["Enums"]["content_review_status"]
            | null
          reviewer_notes?: string | null
          scheduled_at?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      work_logs: {
        Row: {
          category: string
          created_at: string | null
          date: string
          description: string | null
          hours: number
          id: string
          project_id: string | null
          week_number: number
          year: number
        }
        Insert: {
          category?: string
          created_at?: string | null
          date: string
          description?: string | null
          hours?: number
          id?: string
          project_id?: string | null
          week_number: number
          year: number
        }
        Update: {
          category?: string
          created_at?: string | null
          date?: string
          description?: string | null
          hours?: number
          id?: string
          project_id?: string | null
          week_number?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "work_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_like_count: {
        Args: { p_id: string; p_type: string }
        Returns: number
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
      content_review_status:
        | "draft"
        | "pending_review"
        | "approved"
        | "scheduled"
        | "published"
        | "rejected"
      content_type: "text" | "rich_text" | "image" | "json"
      lead_status: "new" | "contacted" | "responded" | "converted" | "archived"
      note_category: "brand" | "marketing" | "content" | "traffic" | "ideas"
      note_status: "idea" | "planned" | "in_progress" | "done"
      project_status: "live" | "in_progress" | "planned"
      search_status: "pending" | "completed" | "failed"
      writing_category:
        | "philosophy"
        | "narrative"
        | "cultural"
        | "ux_review"
        | "research"
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
      content_review_status: [
        "draft",
        "pending_review",
        "approved",
        "scheduled",
        "published",
        "rejected",
      ],
      content_type: ["text", "rich_text", "image", "json"],
      lead_status: ["new", "contacted", "responded", "converted", "archived"],
      note_category: ["brand", "marketing", "content", "traffic", "ideas"],
      note_status: ["idea", "planned", "in_progress", "done"],
      project_status: ["live", "in_progress", "planned"],
      search_status: ["pending", "completed", "failed"],
      writing_category: [
        "philosophy",
        "narrative",
        "cultural",
        "ux_review",
        "research",
      ],
    },
  },
} as const
