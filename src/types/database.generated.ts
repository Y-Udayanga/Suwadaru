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
      child_caregivers: {
        Row: {
          access_level: string
          child_id: string
          created_at: string
          id: string
          relationship: string
          user_id: string
        }
        Insert: {
          access_level: string
          child_id: string
          created_at?: string
          id?: string
          relationship: string
          user_id: string
        }
        Update: {
          access_level?: string
          child_id?: string
          created_at?: string
          id?: string
          relationship?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_caregivers_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          birth_weight_kg: number | null
          clinic_name: string | null
          created_at: string
          created_by: string
          date_of_birth: string
          id: string
          name: string
          sex: string
          updated_at: string
        }
        Insert: {
          birth_weight_kg?: number | null
          clinic_name?: string | null
          created_at?: string
          created_by: string
          date_of_birth: string
          id?: string
          name: string
          sex: string
          updated_at?: string
        }
        Update: {
          birth_weight_kg?: number | null
          clinic_name?: string | null
          created_at?: string
          created_by?: string
          date_of_birth?: string
          id?: string
          name?: string
          sex?: string
          updated_at?: string
        }
        Relationships: []
      }
      clinic_appointments: {
        Row: {
          child_id: string
          clinic_name: string
          created_at: string
          created_by: string
          id: string
          purpose: string | null
          scheduled_at: string
          status: string
          updated_at: string
        }
        Insert: {
          child_id: string
          clinic_name: string
          created_at?: string
          created_by?: string
          id?: string
          purpose?: string | null
          scheduled_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          child_id?: string
          clinic_name?: string
          created_at?: string
          created_by?: string
          id?: string
          purpose?: string | null
          scheduled_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_appointments_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_measurements: {
        Row: {
          child_id: string
          created_at: string
          created_by: string
          head_circumference_cm: number | null
          id: string
          length_height_cm: number | null
          measured_on: string
          source: string
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          child_id: string
          created_at?: string
          created_by?: string
          head_circumference_cm?: number | null
          id?: string
          length_height_cm?: number | null
          measured_on: string
          source?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          child_id?: string
          created_at?: string
          created_by?: string
          head_circumference_cm?: number | null
          id?: string
          length_height_cm?: number | null
          measured_on?: string
          source?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "growth_measurements_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_references: {
        Row: {
          active: boolean
          age_months: number
          id: string
          median_kg: number
          sd_minus1_kg: number
          sd_minus2_kg: number
          sd_plus1_kg: number
          sd_plus2_kg: number
          sex: string
          source_url: string
          source_version: string
        }
        Insert: {
          active?: boolean
          age_months: number
          id?: string
          median_kg: number
          sd_minus1_kg: number
          sd_minus2_kg: number
          sd_plus1_kg: number
          sd_plus2_kg: number
          sex: string
          source_url: string
          source_version: string
        }
        Update: {
          active?: boolean
          age_months?: number
          id?: string
          median_kg?: number
          sd_minus1_kg?: number
          sd_minus2_kg?: number
          sd_plus1_kg?: number
          sd_plus2_kg?: number
          sex?: string
          source_url?: string
          source_version?: string
        }
        Relationships: []
      }
      nutrition_messages: {
        Row: {
          body: string
          child_id: string
          created_at: string
          created_by: string
          id: string
          sender: string
          updated_at: string
        }
        Insert: {
          body: string
          child_id: string
          created_at?: string
          created_by?: string
          id?: string
          sender?: string
          updated_at?: string
        }
        Update: {
          body?: string
          child_id?: string
          created_at?: string
          created_by?: string
          id?: string
          sender?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_messages_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      todos: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      vaccination_records: {
        Row: {
          administered_on: string
          child_id: string
          created_at: string
          created_by: string
          id: string
          source: string
          updated_at: string
          vaccine_code: string
        }
        Insert: {
          administered_on: string
          child_id: string
          created_at?: string
          created_by?: string
          id?: string
          source?: string
          updated_at?: string
          vaccine_code: string
        }
        Update: {
          administered_on?: string
          child_id?: string
          created_at?: string
          created_by?: string
          id?: string
          source?: string
          updated_at?: string
          vaccine_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaccination_records_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccination_schedule: {
        Row: {
          active: boolean
          age_months: number
          id: string
          schedule_version: string
          source_url: string
          vaccine_code: string
          vaccine_name: string
        }
        Insert: {
          active?: boolean
          age_months: number
          id?: string
          schedule_version: string
          source_url: string
          vaccine_code: string
          vaccine_name: string
        }
        Update: {
          active?: boolean
          age_months?: number
          id?: string
          schedule_version?: string
          source_url?: string
          vaccine_code?: string
          vaccine_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_child: {
        Args: {
          p_birth_weight_kg?: number
          p_clinic_name?: string
          p_date_of_birth: string
          p_name: string
          p_relationship?: string
          p_sex: string
        }
        Returns: {
          birth_weight_kg: number | null
          clinic_name: string | null
          created_at: string
          created_by: string
          date_of_birth: string
          id: string
          name: string
          sex: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "children"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
