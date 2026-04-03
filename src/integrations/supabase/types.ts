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
      chatbot_qa: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_active: boolean | null
          keywords: string[] | null
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_algorithms: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string
          description_vi: string
          id: string
          name: string
          name_vi: string
          params: Json
          rejection_reason: string | null
          status: Database["public"]["Enums"]["algorithm_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          code?: string
          created_at?: string
          description?: string
          description_vi?: string
          id?: string
          name: string
          name_vi: string
          params?: Json
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["algorithm_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string
          description_vi?: string
          id?: string
          name?: string
          name_vi?: string
          params?: Json
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["algorithm_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      community_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          status: Database["public"]["Enums"]["post_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          status?: Database["public"]["Enums"]["post_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          status?: Database["public"]["Enums"]["post_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          content: string
          created_at: string
          file_urls: string[] | null
          id: string
          media_urls: string[] | null
          post_type: Database["public"]["Enums"]["post_type"]
          rejection_reason: string | null
          status: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          file_urls?: string[] | null
          id?: string
          media_urls?: string[] | null
          post_type?: Database["public"]["Enums"]["post_type"]
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          file_urls?: string[] | null
          id?: string
          media_urls?: string[] | null
          post_type?: Database["public"]["Enums"]["post_type"]
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      news_articles: {
        Row: {
          category: string
          content: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          language: string
          published_at: string | null
          source: string
          source_url: string | null
          title: string
        }
        Insert: {
          category?: string
          content?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          language?: string
          published_at?: string | null
          source: string
          source_url?: string | null
          title: string
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          language?: string
          published_at?: string | null
          source?: string
          source_url?: string | null
          title?: string
        }
        Relationships: []
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      price_alerts: {
        Row: {
          alert_type: string
          asset_type: string
          created_at: string
          id: string
          is_triggered: boolean
          symbol: string
          target_price: number
          triggered_at: string | null
          user_id: string
        }
        Insert: {
          alert_type?: string
          asset_type?: string
          created_at?: string
          id?: string
          is_triggered?: boolean
          symbol: string
          target_price: number
          triggered_at?: string | null
          user_id: string
        }
        Update: {
          alert_type?: string
          asset_type?: string
          created_at?: string
          id?: string
          is_triggered?: boolean
          symbol?: string
          target_price?: number
          triggered_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          education: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          social_links: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          education?: string | null
          email: string
          full_name: string
          id?: string
          phone?: string | null
          social_links?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          education?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          social_links?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_analysis_history: {
        Row: {
          ai_analysis: Json | null
          created_at: string
          id: string
          params: Json
          project_name: string
          results: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          created_at?: string
          id?: string
          params: Json
          project_name: string
          results: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_analysis?: Json | null
          created_at?: string
          id?: string
          params?: Json
          project_name?: string
          results?: Json
          updated_at?: string
          user_id?: string
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
      watchlist: {
        Row: {
          asset_type: string
          created_at: string
          id: string
          name: string | null
          notes: string | null
          symbol: string
          user_id: string
        }
        Insert: {
          asset_type?: string
          created_at?: string
          id?: string
          name?: string | null
          notes?: string | null
          symbol: string
          user_id: string
        }
        Update: {
          asset_type?: string
          created_at?: string
          id?: string
          name?: string | null
          notes?: string | null
          symbol?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      algorithm_status: "pending" | "approved" | "rejected"
      app_role: "admin" | "user"
      post_status: "pending" | "approved" | "rejected"
      post_type: "discussion" | "blog" | "event"
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
      algorithm_status: ["pending", "approved", "rejected"],
      app_role: ["admin", "user"],
      post_status: ["pending", "approved", "rejected"],
      post_type: ["discussion", "blog", "event"],
    },
  },
} as const
