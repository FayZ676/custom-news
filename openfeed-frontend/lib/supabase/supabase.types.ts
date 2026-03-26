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
      global_articles: {
        Row: {
          content: string | null;
          created_at: string;
          embedding_model: string | null;
          embeddings: string | null;
          feed_title: string;
          id: string;
          published_at: string;
          summary: string | null;
          title: string;
          url: string;
        };
        Insert: {
          content?: string | null;
          created_at?: string;
          embedding_model?: string | null;
          embeddings?: string | null;
          feed_title: string;
          id?: string;
          published_at: string;
          summary?: string | null;
          title: string;
          url: string;
        };
        Update: {
          content?: string | null;
          created_at?: string;
          embedding_model?: string | null;
          embeddings?: string | null;
          feed_title?: string;
          id?: string;
          published_at?: string;
          summary?: string | null;
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
      global_categories: {
        Row: {
          created_at: string;
          id: string;
          interest_suggestions: Json;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          interest_suggestions?: Json;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          interest_suggestions?: Json;
          name?: string;
        };
        Relationships: [];
      };
      global_feeds: {
        Row: {
          category_id: string | null;
          created_at: string;
          description: string;
          id: string;
          title: string;
          url: string;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string;
          description: string;
          id?: string;
          title: string;
          url: string;
        };
        Update: {
          category_id?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          title?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "global_feeds_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "global_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      user_article_scores: {
        Row: {
          article_id: string;
          interest_id: string;
          score: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          article_id: string;
          interest_id: string;
          score: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          article_id?: string;
          interest_id?: string;
          score?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_article_scores_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "global_articles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_article_scores_interest_id_fkey";
            columns: ["interest_id"];
            isOneToOne: false;
            referencedRelation: "user_interests";
            referencedColumns: ["id"];
          },
        ];
      };
      user_category_subscriptions: {
        Row: {
          category_id: string;
          created_at: string;
          user_id: string;
        };
        Insert: {
          category_id: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_category_subscriptions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "global_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      user_interests: {
        Row: {
          created_at: string;
          embedding_model: string;
          embeddings: string;
          id: string;
          query: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          embedding_model: string;
          embeddings: string;
          id?: string;
          query: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          embedding_model?: string;
          embeddings?: string;
          id?: string;
          query?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      match_articles: {
        Args: { match_count: number; query_embedding: string };
        Returns: {
          id: string;
          similarity: number;
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
