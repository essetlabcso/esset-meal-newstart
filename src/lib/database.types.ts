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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      analysis_snapshots: {
        Row: {
          created_at: string
          created_by: string
          id: string
          project_id: string
          snapshot: Json
          tenant_id: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: string
          project_id: string
          snapshot?: Json
          tenant_id: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          project_id?: string
          snapshot?: Json
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_memberships: {
        Row: {
          created_at: string
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          org_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          short_code: string | null
          start_date: string | null
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          short_code?: string | null
          start_date?: string | null
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          short_code?: string | null
          start_date?: string | null
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      toc_assumptions: {
        Row: {
          assumption_text: string
          created_at: string
          id: string
          node_id: string
          risk_level: string | null
          tenant_id: string
          toc_version_id: string
          updated_at: string
        }
        Insert: {
          assumption_text: string
          created_at?: string
          id?: string
          node_id: string
          risk_level?: string | null
          tenant_id: string
          toc_version_id: string
          updated_at?: string
        }
        Update: {
          assumption_text?: string
          created_at?: string
          id?: string
          node_id?: string
          risk_level?: string | null
          tenant_id?: string
          toc_version_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "toc_assumptions_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "toc_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "toc_assumptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "toc_assumptions_toc_version_id_fkey"
            columns: ["toc_version_id"]
            isOneToOne: false
            referencedRelation: "toc_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      toc_edge_assumptions: {
        Row: {
          assumption_text: string
          created_at: string
          edge_id: string
          id: string
          risk_level: string | null
          tenant_id: string
          toc_version_id: string
          updated_at: string
        }
        Insert: {
          assumption_text: string
          created_at?: string
          edge_id: string
          id?: string
          risk_level?: string | null
          tenant_id: string
          toc_version_id: string
          updated_at?: string
        }
        Update: {
          assumption_text?: string
          created_at?: string
          edge_id?: string
          id?: string
          risk_level?: string | null
          tenant_id?: string
          toc_version_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "toc_edge_assumptions_edge_id_fkey"
            columns: ["edge_id"]
            isOneToOne: false
            referencedRelation: "toc_edges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "toc_edge_assumptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "toc_edge_assumptions_toc_version_id_fkey"
            columns: ["toc_version_id"]
            isOneToOne: false
            referencedRelation: "toc_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      toc_edges: {
        Row: {
          created_at: string
          edge_type: string
          id: string
          source_node_id: string
          target_node_id: string
          tenant_id: string
          toc_version_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          edge_type?: string
          id?: string
          source_node_id: string
          target_node_id: string
          tenant_id: string
          toc_version_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          edge_type?: string
          id?: string
          source_node_id?: string
          target_node_id?: string
          tenant_id?: string
          toc_version_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "toc_edges_source_node_id_fkey"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "toc_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "toc_edges_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "toc_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "toc_edges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "toc_edges_toc_version_id_fkey"
            columns: ["toc_version_id"]
            isOneToOne: false
            referencedRelation: "toc_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      toc_nodes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          metadata: Json
          node_type: string
          tenant_id: string
          title: string
          toc_version_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          node_type: string
          tenant_id: string
          title: string
          toc_version_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          node_type?: string
          tenant_id?: string
          title?: string
          toc_version_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "toc_nodes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "toc_nodes_toc_version_id_fkey"
            columns: ["toc_version_id"]
            isOneToOne: false
            referencedRelation: "toc_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      toc_versions: {
        Row: {
          analysis_snapshot_id: string
          created_at: string
          created_by: string
          id: string
          project_id: string
          published_at: string | null
          status: string
          tenant_id: string
          version_number: number
        }
        Insert: {
          analysis_snapshot_id: string
          created_at?: string
          created_by?: string
          id?: string
          project_id: string
          published_at?: string | null
          status: string
          tenant_id: string
          version_number: number
        }
        Update: {
          analysis_snapshot_id?: string
          created_at?: string
          created_by?: string
          id?: string
          project_id?: string
          published_at?: string | null
          status?: string
          tenant_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "toc_versions_analysis_snapshot_id_fkey"
            columns: ["analysis_snapshot_id"]
            isOneToOne: false
            referencedRelation: "analysis_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "toc_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "toc_versions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_toc_draft: {
        Args: {
          _analysis_snapshot_id: string
          _from_version_id?: string
          _project_id: string
          _tenant_id: string
        }
        Returns: string
      }
      is_org_admin: { Args: { _org_id: string }; Returns: boolean }
      is_tenant_member: { Args: { _tenant_id: string }; Returns: boolean }
      publish_toc_version: {
        Args: { _project_id: string; _tenant_id: string; _version_id: string }
        Returns: undefined
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
