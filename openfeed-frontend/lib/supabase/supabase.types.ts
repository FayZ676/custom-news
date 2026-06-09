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
      global_article_metadata_options: {
        Row: {
          description: string;
          field: string;
          name: string;
        };
        Insert: {
          description: string;
          field: string;
          name: string;
        };
        Update: {
          description?: string;
          field?: string;
          name?: string;
        };
        Relationships: [];
      };
      global_articles: {
        Row: {
          coverage: string | null;
          created_at: string;
          duration: string | null;
          feed_title: string;
          id: string;
          image_url: string | null;
          impact: string | null;
          published_at: string;
          summary: string | null;
          title: string;
          topic: string | null;
          type: string | null;
          url: string;
        };
        Insert: {
          coverage?: string | null;
          created_at?: string;
          duration?: string | null;
          feed_title: string;
          id?: string;
          image_url?: string | null;
          impact?: string | null;
          published_at: string;
          summary?: string | null;
          title: string;
          topic?: string | null;
          type?: string | null;
          url: string;
        };
        Update: {
          coverage?: string | null;
          created_at?: string;
          duration?: string | null;
          feed_title?: string;
          id?: string;
          image_url?: string | null;
          impact?: string | null;
          published_at?: string;
          summary?: string | null;
          title?: string;
          topic?: string | null;
          type?: string | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "global_articles_feed_title_fkey";
            columns: ["feed_title"];
            isOneToOne: false;
            referencedRelation: "global_feeds";
            referencedColumns: ["title"];
          },
        ];
      };
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
      global_feeds: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          title: string;
          url: string;
        };
        Insert: {
          created_at?: string;
          description: string;
          id?: string;
          title: string;
          url: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          title?: string;
          url?: string;
        };
        Relationships: [];
      };
      global_settings: {
        Row: {
          article_ttl: string;
          cluster_significance_threshold: number;
          clustering_window_hours: number;
          id: string;
          max_match_count: number;
          notification_hours: number[];
          singleton: boolean;
        };
        Insert: {
          article_ttl: string;
          cluster_significance_threshold?: number;
          clustering_window_hours?: number;
          id?: string;
          max_match_count: number;
          notification_hours: number[];
          singleton?: boolean;
        };
        Update: {
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
      user_article_metadata_options: {
        Row: {
          created_at: string;
          field: string;
          name: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          field: string;
          name: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          field?: string;
          name?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_article_metadata_options_field_name_fkey";
            columns: ["field", "name"];
            isOneToOne: false;
            referencedRelation: "global_article_metadata_options";
            referencedColumns: ["field", "name"];
          },
        ];
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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      search_articles_feed_page: {
        Args: {
          coverage_filters?: string[];
          duration_filters?: string[];
          impact_filters?: string[];
          page_offset?: number;
          page_size?: number;
          query_text?: string;
          topic_filters?: string[];
          type_filters?: string[];
        };
        Returns: {
          coverage: string;
          created_at: string;
          duration: string;
          feed_title: string;
          id: string;
          image_url: string;
          impact: string;
          published_at: string;
          summary: string;
          title: string;
          topic: string;
          total_count: number;
          type: string;
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
