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
      global_article_topics: {
        Row: {
          article_id: string;
          topic_id: string;
          topic_name: string;
        };
        Insert: {
          article_id: string;
          topic_id: string;
          topic_name: string;
        };
        Update: {
          article_id?: string;
          topic_id?: string;
          topic_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "global_article_topics_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "global_articles";
            referencedColumns: ["id"];
          },
        ];
      };
      global_articles: {
        Row: {
          created_at: string;
          feed_title: string;
          id: string;
          image_url: string | null;
          published_at: string;
          significance_score: number;
          summary: string | null;
          summary_embeddings: string | null;
          summary_entities: string[];
          title: string;
          url: string;
        };
        Insert: {
          created_at?: string;
          feed_title: string;
          id?: string;
          image_url?: string | null;
          published_at: string;
          significance_score: number;
          summary?: string | null;
          summary_embeddings?: string | null;
          summary_entities?: string[];
          title: string;
          url: string;
        };
        Update: {
          created_at?: string;
          feed_title?: string;
          id?: string;
          image_url?: string | null;
          published_at?: string;
          significance_score?: number;
          summary?: string | null;
          summary_embeddings?: string | null;
          summary_entities?: string[];
          title?: string;
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
          min_similarity_threshold: number;
          notification_hours: number[];
          singleton: boolean;
        };
        Insert: {
          article_ttl: string;
          cluster_significance_threshold?: number;
          clustering_window_hours?: number;
          id?: string;
          max_match_count: number;
          min_similarity_threshold: number;
          notification_hours: number[];
          singleton?: boolean;
        };
        Update: {
          article_ttl?: string;
          cluster_significance_threshold?: number;
          clustering_window_hours?: number;
          id?: string;
          max_match_count?: number;
          min_similarity_threshold?: number;
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
      global_stories: {
        Row: {
          created_at: string;
          headline: string;
          id: string;
          image_url: string | null;
          related_articles_urls: string[];
          score: number;
          summary: string;
          summary_embeddings: string | null;
          velocity: number;
        };
        Insert: {
          created_at?: string;
          headline: string;
          id?: string;
          image_url?: string | null;
          related_articles_urls?: string[];
          score: number;
          summary: string;
          summary_embeddings?: string | null;
          velocity: number;
        };
        Update: {
          created_at?: string;
          headline?: string;
          id?: string;
          image_url?: string | null;
          related_articles_urls?: string[];
          score?: number;
          summary?: string;
          summary_embeddings?: string | null;
          velocity?: number;
        };
        Relationships: [];
      };
      global_story_topics: {
        Row: {
          story_id: string;
          topic_id: string;
          topic_name: string;
        };
        Insert: {
          story_id: string;
          topic_id: string;
          topic_name: string;
        };
        Update: {
          story_id?: string;
          topic_id?: string;
          topic_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "global_story_topics_story_id_fkey";
            columns: ["story_id"];
            isOneToOne: false;
            referencedRelation: "global_stories";
            referencedColumns: ["id"];
          },
        ];
      };
      global_topics: {
        Row: {
          description: string;
          id: string;
          name: string;
          significance_score: number;
        };
        Insert: {
          description: string;
          id: string;
          name: string;
          significance_score: number;
        };
        Update: {
          description?: string;
          id?: string;
          name?: string;
          significance_score?: number;
        };
        Relationships: [];
      };
      user_keywords: {
        Row: {
          created_at: string;
          keywords: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          keywords: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          keywords?: string;
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
      user_topics: {
        Row: {
          created_at: string;
          topic_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          topic_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          topic_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_topics_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "global_topics";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      match_stories: {
        Args: {
          match_count: number;
          min_similarity: number;
          query_embedding: string;
          query_text: string;
        };
        Returns: {
          headline: string;
          id: string;
          similarity: number;
          summary: string;
        }[];
      };
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
