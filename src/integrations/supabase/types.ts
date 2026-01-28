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
      articles: {
        Row: {
          category: Database["public"]["Enums"]["writing_category"]
          content: string | null
          created_at: string
          excerpt: string | null
          id: string
          published: boolean | null
          reading_time_minutes: number | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["writing_category"]
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean | null
          reading_time_minutes?: number | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["writing_category"]
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean | null
          reading_time_minutes?: number | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      artwork: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          title?: string
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
          created_at: string
          description: string | null
          external_url: string | null
          funding_goal: number | null
          funding_raised: number | null
          id: string
          image_url: string | null
          long_description: string | null
          slug: string
          status: Database["public"]["Enums"]["project_status"]
          tech_stack: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          external_url?: string | null
          funding_goal?: number | null
          funding_raised?: number | null
          id?: string
          image_url?: string | null
          long_description?: string | null
          slug: string
          status?: Database["public"]["Enums"]["project_status"]
          tech_stack?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          external_url?: string | null
          funding_goal?: number | null
          funding_raised?: number | null
          id?: string
          image_url?: string | null
          long_description?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["project_status"]
          tech_stack?: string[] | null
          title?: string
          updated_at?: string
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
      project_status: "live" | "in_progress" | "planned"
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
      project_status: ["live", "in_progress", "planned"],
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
