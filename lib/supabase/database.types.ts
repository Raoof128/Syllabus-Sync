export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1';
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
      app_config: {
        Row: {
          description: string | null;
          id: string;
          key: string;
          updated_at: string;
          updated_by: string | null;
          value: Json;
        };
        Insert: {
          description?: string | null;
          id?: string;
          key: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: Json;
        };
        Update: {
          description?: string | null;
          id?: string;
          key?: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: Json;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          created_at: string;
          id: string;
          ip_address: unknown;
          metadata: Json;
          new_data: Json | null;
          old_data: Json | null;
          record_id: string | null;
          request_id: string | null;
          severity: string;
          table_name: string | null;
          user_agent: string | null;
          user_email: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          id?: string;
          ip_address?: unknown;
          metadata?: Json;
          new_data?: Json | null;
          old_data?: Json | null;
          record_id?: string | null;
          request_id?: string | null;
          severity?: string;
          table_name?: string | null;
          user_agent?: string | null;
          user_email?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          id?: string;
          ip_address?: unknown;
          metadata?: Json;
          new_data?: Json | null;
          old_data?: Json | null;
          record_id?: string | null;
          request_id?: string | null;
          severity?: string;
          table_name?: string | null;
          user_agent?: string | null;
          user_email?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      auth_audit_logs: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          ip_address: string | null;
          metadata: Json;
          user_agent: string | null;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          ip_address?: string | null;
          metadata?: Json;
          user_agent?: string | null;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          ip_address?: string | null;
          metadata?: Json;
          user_agent?: string | null;
        };
        Relationships: [];
      };
      backup_codes: {
        Row: {
          code: string;
          created_at: string;
          id: string;
          used: boolean;
          used_at: string | null;
          user_id: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          id?: string;
          used?: boolean;
          used_at?: string | null;
          user_id: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: string;
          used?: boolean;
          used_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
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
            foreignKeyName: 'class_times_unit_id_fkey';
            columns: ['unit_id'];
            isOneToOne: false;
            referencedRelation: 'units';
            referencedColumns: ['id'];
          },
        ];
      };
      deadlines: {
        Row: {
          building: string | null;
          color: string | null;
          completed: boolean | null;
          created_at: string | null;
          deleted_at: string | null;
          description: string | null;
          due_date: string;
          id: string;
          notification_enabled: boolean;
          priority: string;
          room: string | null;
          title: string;
          type: string;
          unit_code: string;
          unit_id: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          building?: string | null;
          color?: string | null;
          completed?: boolean | null;
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          due_date: string;
          id?: string;
          notification_enabled?: boolean;
          priority?: string;
          room?: string | null;
          title: string;
          type?: string;
          unit_code: string;
          unit_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          building?: string | null;
          color?: string | null;
          completed?: boolean | null;
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          due_date?: string;
          id?: string;
          notification_enabled?: boolean;
          priority?: string;
          room?: string | null;
          title?: string;
          type?: string;
          unit_code?: string;
          unit_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'deadlines_unit_id_fkey';
            columns: ['unit_id'];
            isOneToOne: false;
            referencedRelation: 'units';
            referencedColumns: ['id'];
          },
        ];
      };
      email_verifications: {
        Row: {
          created_at: string | null;
          expires_at: string;
          id: string;
          token_hash: string;
          used: boolean | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          expires_at: string;
          id?: string;
          token_hash: string;
          used?: boolean | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          expires_at?: string;
          id?: string;
          token_hash?: string;
          used?: boolean | null;
          user_id?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          all_day: boolean;
          building: string | null;
          category: string;
          color: string | null;
          created_at: string | null;
          deleted_at: string | null;
          description: string;
          end_at: string | null;
          id: string;
          image_url: string | null;
          is_deleted: boolean | null;
          last_modified_by: string | null;
          location: string;
          notification_enabled: boolean;
          room: string | null;
          schedule_id: string | null;
          source_public_event_id: string | null;
          start_at: string;
          title: string;
          updated_at: string | null;
          user_id: string;
          version: number | null;
        };
        Insert: {
          all_day?: boolean;
          building?: string | null;
          category?: string;
          color?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          description: string;
          end_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_deleted?: boolean | null;
          last_modified_by?: string | null;
          location: string;
          notification_enabled?: boolean;
          room?: string | null;
          schedule_id?: string | null;
          source_public_event_id?: string | null;
          start_at: string;
          title: string;
          updated_at?: string | null;
          user_id: string;
          version?: number | null;
        };
        Update: {
          all_day?: boolean;
          building?: string | null;
          category?: string;
          color?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string;
          end_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_deleted?: boolean | null;
          last_modified_by?: string | null;
          location?: string;
          notification_enabled?: boolean;
          room?: string | null;
          schedule_id?: string | null;
          source_public_event_id?: string | null;
          start_at?: string;
          title?: string;
          updated_at?: string | null;
          user_id?: string;
          version?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'events_schedule_id_fkey';
            columns: ['schedule_id'];
            isOneToOne: false;
            referencedRelation: 'schedules';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'events_source_public_event_id_fkey';
            columns: ['source_public_event_id'];
            isOneToOne: false;
            referencedRelation: 'public_events';
            referencedColumns: ['id'];
          },
        ];
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
      push_reminder_deliveries: {
        Row: {
          id: string;
          metadata: Json;
          related_id: string | null;
          reminder_key: string;
          reminder_type: string;
          scheduled_for: string;
          sent_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          metadata?: Json;
          related_id?: string | null;
          reminder_key: string;
          reminder_type: string;
          scheduled_for: string;
          sent_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          metadata?: Json;
          related_id?: string | null;
          reminder_key?: string;
          reminder_type?: string;
          scheduled_for?: string;
          sent_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          auth_key: string;
          created_at: string;
          endpoint: string;
          expiration_time: string | null;
          failure_count: number;
          id: string;
          last_failure_at: string | null;
          last_success_at: string | null;
          p256dh_key: string;
          updated_at: string;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          auth_key: string;
          created_at?: string;
          endpoint: string;
          expiration_time?: string | null;
          failure_count?: number;
          id?: string;
          last_failure_at?: string | null;
          last_success_at?: string | null;
          p256dh_key: string;
          updated_at?: string;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          auth_key?: string;
          created_at?: string;
          endpoint?: string;
          expiration_time?: string | null;
          failure_count?: number;
          id?: string;
          last_failure_at?: string | null;
          last_success_at?: string | null;
          p256dh_key?: string;
          updated_at?: string;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      password_resets: {
        Row: {
          created_at: string | null;
          expires_at: string;
          id: string;
          token_hash: string;
          used: boolean | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          expires_at: string;
          id?: string;
          token_hash: string;
          used?: boolean | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          expires_at?: string;
          id?: string;
          token_hash?: string;
          used?: boolean | null;
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
          faculty: string | null;
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
          faculty?: string | null;
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
          faculty?: string | null;
          full_name?: string | null;
          id?: string;
          student_id?: string | null;
          updated_at?: string | null;
          year?: string | null;
        };
        Relationships: [];
      };
      public_events: {
        Row: {
          all_day: boolean;
          building: string | null;
          category: string;
          created_at: string;
          deleted_at: string | null;
          description: string;
          end_at: string | null;
          id: string;
          image_url: string | null;
          is_featured: boolean;
          location: string;
          priority: number;
          room: string | null;
          start_at: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          all_day?: boolean;
          building?: string | null;
          category?: string;
          created_at?: string;
          deleted_at?: string | null;
          description: string;
          end_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_featured?: boolean;
          location: string;
          priority?: number;
          room?: string | null;
          start_at: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          all_day?: boolean;
          building?: string | null;
          category?: string;
          created_at?: string;
          deleted_at?: string | null;
          description?: string;
          end_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_featured?: boolean;
          location?: string;
          priority?: number;
          room?: string | null;
          start_at?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      rate_limits: {
        Row: {
          count: number;
          created_at: string;
          key: string;
          reset_time_ms: number;
          updated_at: string;
        };
        Insert: {
          count: number;
          created_at?: string;
          key: string;
          reset_time_ms: number;
          updated_at?: string;
        };
        Update: {
          count?: number;
          created_at?: string;
          key?: string;
          reset_time_ms?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      schedule_members: {
        Row: {
          created_at: string | null;
          id: string;
          role: string;
          schedule_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          role?: string;
          schedule_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          role?: string;
          schedule_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'schedule_members_schedule_id_fkey';
            columns: ['schedule_id'];
            isOneToOne: false;
            referencedRelation: 'schedules';
            referencedColumns: ['id'];
          },
        ];
      };
      schedules: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          is_public: boolean | null;
          owner_id: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_public?: boolean | null;
          owner_id: string;
          title?: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_public?: boolean | null;
          owner_id?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      todos: {
        Row: {
          color: string | null;
          completed: boolean;
          completed_at: string | null;
          created_at: string;
          deleted_at: string | null;
          description: string | null;
          due_date: string | null;
          id: string;
          notification_enabled: boolean;
          priority: string;
          title: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          color?: string | null;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          notification_enabled?: boolean;
          priority?: string;
          title: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          color?: string | null;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          notification_enabled?: boolean;
          priority?: string;
          title?: string;
          updated_at?: string | null;
          user_id?: string;
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
          notification_enabled: boolean;
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
          notification_enabled?: boolean;
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
          notification_enabled?: boolean;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          class_notifications_enabled: boolean | null;
          class_reminder_timing_minutes: number | null;
          created_at: string | null;
          deadline_notifications_enabled: boolean | null;
          deadline_reminder_timing_minutes: number | null;
          email_notifications: boolean | null;
          event_notifications_enabled: boolean | null;
          event_reminder_timing_minutes: number | null;
          id: string;
          notifications_enabled: boolean | null;
          push_notifications: boolean | null;
          theme: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          class_notifications_enabled?: boolean | null;
          class_reminder_timing_minutes?: number | null;
          created_at?: string | null;
          deadline_notifications_enabled?: boolean | null;
          deadline_reminder_timing_minutes?: number | null;
          email_notifications?: boolean | null;
          event_notifications_enabled?: boolean | null;
          event_reminder_timing_minutes?: number | null;
          id?: string;
          notifications_enabled?: boolean | null;
          push_notifications?: boolean | null;
          theme?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          class_notifications_enabled?: boolean | null;
          class_reminder_timing_minutes?: number | null;
          created_at?: string | null;
          deadline_notifications_enabled?: boolean | null;
          deadline_reminder_timing_minutes?: number | null;
          email_notifications?: boolean | null;
          event_notifications_enabled?: boolean | null;
          event_reminder_timing_minutes?: number | null;
          id?: string;
          notifications_enabled?: boolean | null;
          push_notifications?: boolean | null;
          theme?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_sessions: {
        Row: {
          created_at: string;
          device_info: string | null;
          id: string;
          ip_address: string | null;
          last_activity_at: string;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          device_info?: string | null;
          id?: string;
          ip_address?: string | null;
          last_activity_at?: string;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          device_info?: string | null;
          id?: string;
          ip_address?: string | null;
          last_activity_at?: string;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      webauthn_challenges: {
        Row: {
          challenge: string;
          created_at: string;
          expires_at: string;
          id: string;
          type: string;
          user_id: string | null;
        };
        Insert: {
          challenge: string;
          created_at?: string;
          expires_at?: string;
          id?: string;
          type: string;
          user_id?: string | null;
        };
        Update: {
          challenge?: string;
          created_at?: string;
          expires_at?: string;
          id?: string;
          type?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      webauthn_credentials: {
        Row: {
          counter: number;
          created_at: string;
          credential_id: string;
          device_name: string;
          id: string;
          last_used_at: string | null;
          public_key: string;
          transports: string[];
          user_id: string;
        };
        Insert: {
          counter?: number;
          created_at?: string;
          credential_id: string;
          device_name?: string;
          id?: string;
          last_used_at?: string | null;
          public_key: string;
          transports?: string[];
          user_id: string;
        };
        Update: {
          counter?: number;
          created_at?: string;
          credential_id?: string;
          device_name?: string;
          id?: string;
          last_used_at?: string | null;
          public_key?: string;
          transports?: string[];
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
          faculty: string | null;
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
      add_public_event_to_calendar: {
        Args: { p_public_event_id: string };
        Returns: string;
      };
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
      cleanup_expired_email_verifications: { Args: never; Returns: number };
      cleanup_expired_password_resets: { Args: never; Returns: number };
      cleanup_expired_rate_limits: { Args: never; Returns: number };
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
      get_my_audit_logs: {
        Args: {
          p_action?: string;
          p_end_date?: string;
          p_limit?: number;
          p_offset?: number;
          p_severity?: string;
          p_start_date?: string;
        };
        Returns: {
          action: string;
          created_at: string;
          id: string;
          ip_address: string;
          metadata: Json;
          new_data: Json;
          old_data: Json;
          record_id: string;
          severity: string;
          table_name: string;
          user_agent: string;
          user_id: string;
        }[];
      };
      get_my_profile: {
        Args: never;
        Returns: {
          avatar_url: string;
          course: string;
          created_at: string;
          email: string;
          faculty: string;
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
      log_audit: {
        Args: {
          p_action: string;
          p_ip_address?: string;
          p_metadata?: Json;
          p_new_data?: Json;
          p_old_data?: Json;
          p_record_id?: string;
          p_severity?: string;
          p_table_name?: string;
          p_user_agent?: string;
          p_user_id?: string;
        };
        Returns: string;
      };
      lookup_user_by_email: {
        Args: { lookup_email: string };
        Returns: {
          user_email: string;
          user_id: string;
          user_meta: Json;
        }[];
      };
      purge_deleted_records: { Args: { p_days_old?: number }; Returns: Json };
      ratelimit_get: {
        Args: { rl_key: string };
        Returns: {
          count: number;
          reset_time_ms: number;
        }[];
      };
      ratelimit_increment: {
        Args: { rl_key: string; rl_window_ms: number };
        Returns: {
          count: number;
          reset_time_ms: number;
        }[];
      };
      ratelimit_set: {
        Args: {
          rl_count: number;
          rl_key: string;
          rl_reset_time_ms: number;
          rl_ttl_ms: number;
        };
        Returns: undefined;
      };
      refresh_analytics_views: { Args: never; Returns: undefined };
      restore_deleted: {
        Args: { p_record_id: string; p_table_name: string; p_user_id: string };
        Returns: boolean;
      };
      seed_demo_class_times: { Args: { p_user_id: string }; Returns: undefined };
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
      upsert_unit_with_schedule: {
        Args: { p_schedule: Json; p_unit: Json };
        Returns: Json;
      };
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
