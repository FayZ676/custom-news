export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      global_emails: {
        Row: {
          created_at: string;
          email_text: string;
          id: string;
        };
        Insert: {
          created_at?: string;
          email_text: string;
          id?: string;
        };
        Update: {
          created_at?: string;
          email_text?: string;
          id?: string;
        };
        Relationships: [];
      };
      global_settings: {
        Row: {
          admin_email: string;
          article_ttl: string;
          cluster_significance_threshold: number;
          clustering_window_hours: number;
          id: string;
          max_match_count: number;
          notification_hours: number[];
          singleton: boolean;
        };
        Insert: {
          admin_email: string;
          article_ttl: string;
          cluster_significance_threshold?: number;
          clustering_window_hours?: number;
          id?: string;
          max_match_count: number;
          notification_hours: number[];
          singleton?: boolean;
        };
        Update: {
          admin_email?: string;
          article_ttl?: string;
          cluster_significance_threshold?: number;
          clustering_window_hours?: number;
          id?: string;
          max_match_count?: number;
          notification_hours?: number[];
          singleton?: boolean;
        };
        Relationships: [];
      };
      global_share_links: {
        Row: {
          content_id: string;
          content_type: string;
          created_at: string | null;
          created_by: string | null;
          expires_at: string;
          token: string;
        };
        Insert: {
          content_id: string;
          content_type: string;
          created_at?: string | null;
          created_by?: string | null;
          expires_at?: string;
          token?: string;
        };
        Update: {
          content_id?: string;
          content_type?: string;
          created_at?: string | null;
          created_by?: string | null;
          expires_at?: string;
          token?: string;
        };
        Relationships: [];
      };
      global_sources: {
        Row: {
          created_at: string;
          feed_url: string;
          key: string;
          label: string;
        };
        Insert: {
          created_at?: string;
          feed_url: string;
          key: string;
          label: string;
        };
        Update: {
          created_at?: string;
          feed_url?: string;
          key?: string;
          label?: string;
        };
        Relationships: [];
      };
      user_articles: {
        Row: {
          created_at: string;
          id: string;
          image_url: string | null;
          interest_id: string | null;
          published_at: string;
          search_vector: unknown;
          source_key: string | null;
          source_name: string;
          summary: string | null;
          title: string;
          url: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          image_url?: string | null;
          interest_id?: string | null;
          published_at: string;
          search_vector?: unknown;
          source_key?: string | null;
          source_name: string;
          summary?: string | null;
          title: string;
          url: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          image_url?: string | null;
          interest_id?: string | null;
          published_at?: string;
          search_vector?: unknown;
          source_key?: string | null;
          source_name?: string;
          summary?: string | null;
          title?: string;
          url?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_articles_interest_id_fkey";
            columns: ["interest_id"];
            isOneToOne: false;
            referencedRelation: "user_interests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_articles_source_key_fkey";
            columns: ["source_key"];
            isOneToOne: false;
            referencedRelation: "global_sources";
            referencedColumns: ["key"];
          },
        ];
      };
      user_feedback: {
        Row: {
          created_at: string;
          id: string;
          message: string;
          user_email: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          message: string;
          user_email?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          message?: string;
          user_email?: string | null;
        };
        Relationships: [];
      };
      user_interests: {
        Row: {
          created_at: string;
          id: string;
          interest_text: string;
          query_payload: Json | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          interest_text: string;
          query_payload?: Json | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          interest_text?: string;
          query_payload?: Json | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          color_theme: string;
          email_notification: boolean;
          timezone: string;
          user_id: string;
        };
        Insert: {
          color_theme?: string;
          email_notification?: boolean;
          timezone?: string;
          user_id: string;
        };
        Update: {
          color_theme?: string;
          email_notification?: boolean;
          timezone?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_sources: {
        Row: {
          created_at: string;
          id: string;
          source_key: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          source_key: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          source_key?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_sources_source_key_fkey";
            columns: ["source_key"];
            isOneToOne: false;
            referencedRelation: "global_sources";
            referencedColumns: ["key"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_shared_article: {
        Args: { p_token: string };
        Returns: {
          created_at: string;
          id: string;
          image_url: string;
          published_at: string;
          source_name: string;
          summary: string;
          title: string;
          url: string;
        }[];
      };
      show_limit: { Args: never; Returns: number };
      show_trgm: { Args: { "": string }; Returns: string[] };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
