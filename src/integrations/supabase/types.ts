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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      links: {
        Row: {
          access: string
          allowed_identities: string[]
          created_at: string
          feed_visibility: string
          id: string
          keyword_filters: string[]
          owner_id: string
          prompt: string
          slug: string
          status: string
          title: string
          type: string
        }
        Insert: {
          access?: string
          allowed_identities?: string[]
          created_at?: string
          feed_visibility?: string
          id?: string
          keyword_filters?: string[]
          owner_id: string
          prompt?: string
          slug: string
          status?: string
          title?: string
          type?: string
        }
        Update: {
          access?: string
          allowed_identities?: string[]
          created_at?: string
          feed_visibility?: string
          id?: string
          keyword_filters?: string[]
          owner_id?: string
          prompt?: string
          slug?: string
          status?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          answered: boolean
          body: string
          created_at: string
          id: string
          idempotency_key: string | null
          identity_id: string | null
          pinned: boolean
          reply_to_id: string | null
          sender_type: string
          state: string
          thread_id: string
        }
        Insert: {
          answered?: boolean
          body: string
          created_at?: string
          id?: string
          idempotency_key?: string | null
          identity_id?: string | null
          pinned?: boolean
          reply_to_id?: string | null
          sender_type: string
          state?: string
          thread_id: string
        }
        Update: {
          answered?: boolean
          body?: string
          created_at?: string
          id?: string
          idempotency_key?: string | null
          identity_id?: string | null
          pinned?: boolean
          reply_to_id?: string | null
          sender_type?: string
          state?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: false
            referencedRelation: "respondent_identities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age_confirmed: boolean
          avatar_url: string | null
          bio: string
          created_at: string
          display_name: string
          handle: string | null
          id: string
        }
        Insert: {
          age_confirmed?: boolean
          avatar_url?: string | null
          bio?: string
          created_at?: string
          display_name?: string
          handle?: string | null
          id: string
        }
        Update: {
          age_confirmed?: boolean
          avatar_url?: string | null
          bio?: string
          created_at?: string
          display_name?: string
          handle?: string | null
          id?: string
        }
        Relationships: []
      }
      rate_limit_events: {
        Row: {
          bucket_key: string
          created_at: string
          id: number
        }
        Insert: {
          bucket_key: string
          created_at?: string
          id?: never
        }
        Update: {
          bucket_key?: string
          created_at?: string
          id?: never
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          message_id: string
          message_snapshot: string
          reason: string
          reporter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          message_snapshot?: string
          reason: string
          reporter_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          message_snapshot?: string
          reason?: string
          reporter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      respondent_identities: {
        Row: {
          alias: string
          blocked: boolean
          created_at: string
          device_token_hash: string
          display_name: string | null
          id: string
          identity_mode: string
          link_id: string
        }
        Insert: {
          alias: string
          blocked?: boolean
          created_at?: string
          device_token_hash: string
          display_name?: string | null
          id?: string
          identity_mode?: string
          link_id: string
        }
        Update: {
          alias?: string
          blocked?: boolean
          created_at?: string
          device_token_hash?: string
          display_name?: string | null
          id?: string
          identity_mode?: string
          link_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "respondent_identities_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "links"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          link_id: string
          owner_label: string | null
          owner_unread: number
          pinned: boolean
          public_label: string
          recovery_code_hash: string | null
          respondent_identity_id: string | null
          secret_hash: string | null
          state: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          link_id: string
          owner_label?: string | null
          owner_unread?: number
          pinned?: boolean
          public_label?: string
          recovery_code_hash?: string | null
          respondent_identity_id?: string | null
          secret_hash?: string | null
          state?: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          link_id?: string
          owner_label?: string | null
          owner_unread?: number
          pinned?: boolean
          public_label?: string
          recovery_code_hash?: string | null
          respondent_identity_id?: string | null
          secret_hash?: string | null
          state?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "threads_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_respondent_identity_id_fkey"
            columns: ["respondent_identity_id"]
            isOneToOne: false
            referencedRelation: "respondent_identities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      owns_link: { Args: { _link_id: string }; Returns: boolean }
      owns_thread: { Args: { _thread_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
