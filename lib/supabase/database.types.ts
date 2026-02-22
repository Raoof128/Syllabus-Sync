export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
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
      class_times: {
        Row: {
          created_at: string | null;
          day: string;
          end_time: string;
          id: string;
          start_time: string;
          unit_id: string;
        };
        Insert: {
          created_at?: string | null;
          day: string;
          end_time: string;
          id?: string;
          start_time: string;
          unit_id: string;
        };
        Update: {
          created_at?: string | null;
          day?: string;
          end_time?: string;
          id?: string;
          start_time?: string;
          unit_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "class_times_unit_id_fkey";
            columns: ["unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id"];
          },
        ];
      };
      deadlines: {
        Row: {
          completed: boolean | null;
          created_at: string | null;
          deleted_at: string | null;
          description: string | null;
          due_date: string;
          id: string;
          priority: string;
          title: string;
          type: string;
          unit_code: string;
          unit_id: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          completed?: boolean | null;
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          due_date: string;
          id?: string;
          priority?: string;
          title: string;
          type?: string;
          unit_code: string;
          unit_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          completed?: boolean | null;
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          due_date?: string;
          id?: string;
          priority?: string;
          title?: string;
          type?: string;
          unit_code?: string;
          unit_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "deadlines_unit_id_fkey";
            columns: ["unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          all_day: boolean;
          building: string | null;
          category: string;
          created_at: string | null;
          deleted_at: string | null;
          description: string;
          end_at: string | null;
          id: string;
          image_url: string | null;
          location: string;
          start_at: string;
          title: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          all_day?: boolean;
          building?: string | null;
          category?: string;
          created_at?: string | null;
          deleted_at?: string | null;
          description: string;
          end_at?: string | null;
          id?: string;
          image_url?: string | null;
          location: string;
          start_at: string;
          title: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          all_day?: boolean;
          building?: string | null;
          category?: string;
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string;
          end_at?: string | null;
          id?: string;
          image_url?: string | null;
          location?: string;
          start_at?: string;
          title?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      gamification_profiles: {
        Row: {
          created_at: string;
          id: string;
          last_activity_date: string | null;
          longest_streak: number;
          streak_days: number;
          updated_at: string | null;
          user_id: string;
          xp: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          last_activity_date?: string | null;
          longest_streak?: number;
          streak_days?: number;
          updated_at?: string | null;
          user_id: string;
          xp?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          last_activity_date?: string | null;
          longest_streak?: number;
          streak_days?: number;
          updated_at?: string | null;
          user_id?: string;
          xp?: number;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          link: string | null;
          message: string;
          read: boolean | null;
          related_id: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          link?: string | null;
          message: string;
          read?: boolean | null;
          related_id?: string | null;
          title: string;
          type?: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          link?: string | null;
          message?: string;
          read?: boolean | null;
          related_id?: string | null;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          course: string | null;
          created_at: string | null;
          email: string;
          full_name: string | null;
          id: string;
          student_id: string | null;
          updated_at: string | null;
          year: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          course?: string | null;
          created_at?: string | null;
          email: string;
          full_name?: string | null;
          id?: string;
          student_id?: string | null;
          updated_at?: string | null;
          year?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          course?: string | null;
          created_at?: string | null;
          email?: string;
          full_name?: string | null;
          id?: string;
          student_id?: string | null;
          updated_at?: string | null;
          year?: string | null;
        };
        Relationships: [];
      };
      todos: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          priority: string;
          completed: boolean;
          due_date: string | null;
          completed_at: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          priority?: string;
          completed?: boolean;
          due_date?: string | null;
          completed_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          priority?: string;
          completed?: boolean;
          due_date?: string | null;
          completed_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      units: {
        Row: {
          code: string;
          color: string;
          created_at: string | null;
          deleted_at: string | null;
          description: string | null;
          id: string;
          location: Json | null;
          name: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          code: string;
          color?: string;
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          location?: Json | null;
          name: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          code?: string;
          color?: string;
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          location?: Json | null;
          name?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          created_at: string | null;
          email_notifications: boolean | null;
          id: string;
          notifications_enabled: boolean | null;
          theme: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          email_notifications?: boolean | null;
          id?: string;
          notifications_enabled?: boolean | null;
          theme?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          email_notifications?: boolean | null;
          id?: string;
          notifications_enabled?: boolean | null;
          theme?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      xp_config: {
        Row: {
          base_xp: number;
          description: string | null;
          event_type: string;
          id: string | null;
        };
        Insert: {
          base_xp: number;
          description?: string | null;
          event_type: string;
          id?: string | null;
        };
        Update: {
          base_xp?: number;
          description?: string | null;
          event_type?: string;
          id?: string | null;
        };
        Relationships: [];
      };
      xp_events: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          metadata: Json | null;
          reference_id: string | null;
          user_id: string;
          xp_amount: number;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          metadata?: Json | null;
          reference_id?: string | null;
          user_id: string;
          xp_amount: number;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          metadata?: Json | null;
          reference_id?: string | null;
          user_id?: string;
          xp_amount?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      mv_deadline_analytics: {
        Row: {
          avg_completion_hours: number | null;
          completed_count: number | null;
          overdue_count: number | null;
          priority: string | null;
          total_count: number | null;
          type: string | null;
          user_id: string | null;
          week_start: string | null;
        };
        Relationships: [];
      };
      mv_user_activity_summary: {
        Row: {
          completed_deadline_count: number | null;
          deadline_count: number | null;
          email: string | null;
          full_name: string | null;
          last_activity_date: string | null;
          level: number | null;
          longest_streak: number | null;
          overdue_deadline_count: number | null;
          streak_days: number | null;
          unit_count: number | null;
          unread_notification_count: number | null;
          user_created_at: string | null;
          user_id: string | null;
          xp: number | null;
        };
        Relationships: [];
      };
      mv_xp_leaderboard: {
        Row: {
          avatar_url: string | null;
          full_name: string | null;
          level: number | null;
          longest_streak: number | null;
          rank: number | null;
          streak_days: number | null;
          user_id: string | null;
          xp: number | null;
        };
        Relationships: [];
      };
      user_details: {
        Row: {
          avatar_url: string | null;
          course: string | null;
          created_at: string | null;
          email: string | null;
          full_name: string | null;
          id: string | null;
          last_activity_date: string | null;
          level: number | null;
          longest_streak: number | null;
          streak_days: number | null;
          student_id: string | null;
          updated_at: string | null;
          xp: number | null;
          year: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      award_xp: {
        Args: {
          p_event_type: string;
          p_metadata?: Json;
          p_reference_id?: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      calculate_level: { Args: { p_xp: number }; Returns: number };
      clear_user_data: { Args: { p_user_id: string }; Returns: Json };
      create_unit_with_schedule: {
        Args: {
          p_building: string;
          p_code: string;
          p_color: string;
          p_description?: string;
          p_name: string;
          p_room: string;
          p_schedule?: Json;
          p_user_id: string;
        };
        Returns: Json;
      };
      create_user_profile: {
        Args: {
          p_email: string;
          p_full_name?: string;
          p_student_id?: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      get_my_profile: {
        Args: never;
        Returns: {
          avatar_url: string;
          course: string;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          last_activity_date: string;
          level: number;
          longest_streak: number;
          streak_days: number;
          student_id: string;
          updated_at: string;
          xp: number;
          year: string;
        }[];
      };
      purge_deleted_records: { Args: { p_days_old?: number }; Returns: Json };
      refresh_analytics_views: { Args: never; Returns: undefined };
      restore_deleted: {
        Args: { p_record_id: string; p_table_name: string; p_user_id: string };
        Returns: boolean;
      };
      seed_demo_class_times: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      seed_demo_data_for_user:
        | { Args: { p_user_id: string }; Returns: Json }
        | {
            Args: {
              p_user_id: string;
              p_user_name: string;
              p_user_variant: number;
            };
            Returns: undefined;
          };
      seed_demo_deadlines: { Args: { p_user_id: string }; Returns: undefined };
      seed_demo_events: { Args: never; Returns: undefined };
      seed_demo_notifications: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      seed_demo_units: { Args: { p_user_id: string }; Returns: undefined };
      update_streak: { Args: { p_user_id: string }; Returns: undefined };
      xp_for_level: { Args: { p_level: number }; Returns: number };
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
