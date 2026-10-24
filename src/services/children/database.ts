/** Phase 5 Data API surface, kept in sync with the child migrations. */
export type ChildRow = {
  id: string
  name: string
  date_of_birth: string
  sex: 'male' | 'female'
  birth_weight_kg: number | null
  clinic_name: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export type ChildPatch = Partial<Pick<ChildRow,
  'name' | 'date_of_birth' | 'sex' | 'birth_weight_kg' | 'clinic_name'>>

export type ChildDatabase = {
  public: {
    Tables: {
      children: {
        Row: ChildRow
        Insert: never // Browser creation must use the transactional RPC.
        Update: ChildPatch
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      create_child: {
        Args: {
          p_name: string
          p_date_of_birth: string
          p_sex: string
          p_birth_weight_kg?: number | null
          p_relationship?: string
          p_clinic_name?: string | null
        }
        Returns: ChildRow
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
