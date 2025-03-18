export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chat_messages: {
        Row: {
          attachments: Json[] | null
          content: Json | null
          created_at: string | null
          file_ids: string[] | null
          id: string
          message_id: string
          metadata: Json | null
          role: string
          thread_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attachments?: Json[] | null
          content?: Json | null
          created_at?: string | null
          file_ids?: string[] | null
          id?: string
          message_id: string
          metadata?: Json | null
          role: string
          thread_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attachments?: Json[] | null
          content?: Json | null
          created_at?: string | null
          file_ids?: string[] | null
          id?: string
          message_id?: string
          metadata?: Json | null
          role?: string
          thread_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey1"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["thread_id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          assistant_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_message_at: string | null
          last_run: string | null
          last_run_status: string | null
          metadata: string[] | null
          status: Database["public"]["Enums"]["thread_status"] | null
          thread_id: string
          title: string | null
          tool_resources: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assistant_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          last_run?: string | null
          last_run_status?: string | null
          metadata?: string[] | null
          status?: Database["public"]["Enums"]["thread_status"] | null
          thread_id: string
          title?: string | null
          tool_resources?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assistant_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          last_run?: string | null
          last_run_status?: string | null
          metadata?: string[] | null
          status?: Database["public"]["Enums"]["thread_status"] | null
          thread_id?: string
          title?: string | null
          tool_resources?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_threads_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      compliance_documents: {
        Row: {
          created_at: string | null
          document_type: string | null
          framework_id: number | null
          id: string
          is_active: boolean | null
          publish_date: string | null
          source: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          document_type?: string | null
          framework_id?: number | null
          id?: string
          is_active?: boolean | null
          publish_date?: string | null
          source?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          document_type?: string | null
          framework_id?: number | null
          id?: string
          is_active?: boolean | null
          publish_date?: string | null
          source?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_documents_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "compliance_frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_embeddings: {
        Row: {
          content: string
          created_at: string | null
          document_id: string | null
          embedding: string | null
          framework_id: number | null
          id: number
          section_title: string | null
          token_count: number
        }
        Insert: {
          content: string
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          framework_id?: number | null
          id?: number
          section_title?: string | null
          token_count: number
        }
        Update: {
          content?: string
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          framework_id?: number | null
          id?: number
          section_title?: string | null
          token_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "compliance_embeddings_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "compliance_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_embeddings_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "compliance_frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_frameworks: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      document_embeddings: {
        Row: {
          chunk_index: number
          content: string
          created_at: string | null
          document_id: string | null
          embedding: string | null
          id: number
          token_count: number
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: number
          token_count: number
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: number
          token_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_embeddings_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["document_id"]
          },
        ]
      }
      documents: {
        Row: {
          bucket: string
          compliance_concern: string | null
          compliance_concern_other: string | null
          created_at: string
          document_id: string
          facility_id: string | null
          file_name: string | null
          file_path: string
          file_size: string | null
          file_type: string | null
          metadata: Json[] | null
          openai_file_id: string | null
          patient_id: string | null
          processing_error: string | null
          processing_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bucket: string
          compliance_concern?: string | null
          compliance_concern_other?: string | null
          created_at?: string
          document_id?: string
          facility_id?: string | null
          file_name?: string | null
          file_path: string
          file_size?: string | null
          file_type?: string | null
          metadata?: Json[] | null
          openai_file_id?: string | null
          patient_id?: string | null
          processing_error?: string | null
          processing_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bucket?: string
          compliance_concern?: string | null
          compliance_concern_other?: string | null
          created_at?: string
          document_id?: string
          facility_id?: string | null
          file_name?: string | null
          file_path?: string
          file_size?: string | null
          file_type?: string | null
          metadata?: Json[] | null
          openai_file_id?: string | null
          patient_id?: string | null
          processing_error?: string | null
          processing_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      facility_accreditations: {
        Row: {
          account_number: string
          expiration_date: string
          facility_id: string
          id: number
          organization_id: string
          organization_name: string
          receive_date: string
        }
        Insert: {
          account_number: string
          expiration_date: string
          facility_id: string
          id?: number
          organization_id: string
          organization_name: string
          receive_date: string
        }
        Update: {
          account_number?: string
          expiration_date?: string
          facility_id?: string
          id?: number
          organization_id?: string
          organization_name?: string
          receive_date?: string
        }
        Relationships: []
      }
      nods_page: {
        Row: {
          checksum: string | null
          id: number
          meta: Json | null
          parent_page_id: number | null
          path: string
          source: string | null
          type: string | null
        }
        Insert: {
          checksum?: string | null
          id?: number
          meta?: Json | null
          parent_page_id?: number | null
          path: string
          source?: string | null
          type?: string | null
        }
        Update: {
          checksum?: string | null
          id?: number
          meta?: Json | null
          parent_page_id?: number | null
          path?: string
          source?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nods_page_parent_page_id_fkey"
            columns: ["parent_page_id"]
            isOneToOne: false
            referencedRelation: "nods_page"
            referencedColumns: ["id"]
          },
        ]
      }
      nods_page_section: {
        Row: {
          content: string | null
          embedding: string | null
          heading: string | null
          id: number
          page_id: number
          slug: string | null
          token_count: number | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          heading?: string | null
          id?: number
          page_id: number
          slug?: string | null
          token_count?: number | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          heading?: string | null
          id?: number
          page_id?: number
          slug?: string | null
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nods_page_section_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "nods_page"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          about: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          facility_id: string | null
          first_name: string | null
          is_owner: boolean
          last_name: string | null
          phone: string | null
          postal_code: string | null
          preferred_language: string | null
          profile_image_url: string | null
          state: string | null
          street_address: string | null
          title: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          about?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          facility_id?: string | null
          first_name?: string | null
          is_owner?: boolean
          last_name?: string | null
          phone?: string | null
          postal_code?: string | null
          preferred_language?: string | null
          profile_image_url?: string | null
          state?: string | null
          street_address?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          about?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          facility_id?: string | null
          first_name?: string | null
          is_owner?: boolean
          last_name?: string | null
          phone?: string | null
          postal_code?: string | null
          preferred_language?: string | null
          profile_image_url?: string | null
          state?: string | null
          street_address?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      thread_runs: {
        Row: {
          assistant_id: string | null
          cancelled_at: string | null
          completed_at: string | null
          completion_tokens: number | null
          created_at: string | null
          expires_at: string | null
          failed_at: string | null
          id: string
          instructions: string | null
          last_error: Json | null
          max_completion_tokens: number | null
          max_prompt_tokens: number | null
          metadata: Json | null
          model: string | null
          parallel_tool_calls: boolean | null
          prompt_tokens: number | null
          required_action: Json | null
          response_format: string | null
          run_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["run_status_type"]
          temperature: number | null
          thread_id: string
          tool_choice: string | null
          tools: Json | null
          top_p: number | null
          total_tokens: number | null
          truncation_strategy: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          completion_tokens?: number | null
          created_at?: string | null
          expires_at?: string | null
          failed_at?: string | null
          id?: string
          instructions?: string | null
          last_error?: Json | null
          max_completion_tokens?: number | null
          max_prompt_tokens?: number | null
          metadata?: Json | null
          model?: string | null
          parallel_tool_calls?: boolean | null
          prompt_tokens?: number | null
          required_action?: Json | null
          response_format?: string | null
          run_id: string
          started_at?: string | null
          status: Database["public"]["Enums"]["run_status_type"]
          temperature?: number | null
          thread_id: string
          tool_choice?: string | null
          tools?: Json | null
          top_p?: number | null
          total_tokens?: number | null
          truncation_strategy?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          completion_tokens?: number | null
          created_at?: string | null
          expires_at?: string | null
          failed_at?: string | null
          id?: string
          instructions?: string | null
          last_error?: Json | null
          max_completion_tokens?: number | null
          max_prompt_tokens?: number | null
          metadata?: Json | null
          model?: string | null
          parallel_tool_calls?: boolean | null
          prompt_tokens?: number | null
          required_action?: Json | null
          response_format?: string | null
          run_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["run_status_type"]
          temperature?: number | null
          thread_id?: string
          tool_choice?: string | null
          tools?: Json | null
          top_p?: number | null
          total_tokens?: number | null
          truncation_strategy?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_api_settings: {
        Row: {
          created_at: string
          has_api_key_configured: boolean
          id: number
          kipu_access_id: string
          kipu_api_endpoint: string
          kipu_app_id: string
          kipu_secret_key: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          has_api_key_configured: boolean
          id?: number
          kipu_access_id: string
          kipu_api_endpoint: string
          kipu_app_id: string
          kipu_secret_key: string
          owner_id: string
        }
        Update: {
          created_at?: string
          has_api_key_configured?: boolean
          id?: number
          kipu_access_id?: string
          kipu_api_endpoint?: string
          kipu_app_id?: string
          kipu_secret_key?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_api_settings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_compliance_preferences: {
        Row: {
          created_at: string | null
          framework_id: number | null
          id: number
          is_active: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          framework_id?: number | null
          id?: number
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          framework_id?: number | null
          id?: number
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_compliance_preferences_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "compliance_frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_facilities: {
        Row: {
          assigned_at: string
          facility_id: string
          role: Database["public"]["Enums"]["facility_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          facility_id: string
          role: Database["public"]["Enums"]["facility_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          facility_id?: string
          role?: Database["public"]["Enums"]["facility_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_facilities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize:
        | {
            Args: {
              "": string
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      get_page_parents: {
        Args: {
          page_id: number
        }
        Returns: {
          id: number
          parent_page_id: number
          path: string
          meta: Json
        }[]
      }
      halfvec_avg: {
        Args: {
          "": number[]
        }
        Returns: unknown
      }
      halfvec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      halfvec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      hnsw_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnswhandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflathandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      l2_norm:
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      l2_normalize:
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      match_document_embeddings: {
        Args: {
          query_embedding: string
          match_threshold: number
          match_count: number
        }
        Returns: {
          document_id: string
          file_name: string
          content: string
          similarity: number
        }[]
      }
      match_page_sections: {
        Args: {
          embedding: string
          match_threshold: number
          match_count: number
          min_content_length: number
        }
        Returns: {
          id: number
          page_id: number
          slug: string
          heading: string
          content: string
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      sparsevec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      sync_chat_messages: {
        Args: {
          p_thread_id: string
          p_messages: Json[]
        }
        Returns: undefined
      }
      vector_avg: {
        Args: {
          "": number[]
        }
        Returns: string
      }
      vector_dims:
        | {
            Args: {
              "": string
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      vector_norm: {
        Args: {
          "": string
        }
        Returns: number
      }
      vector_out: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      vector_send: {
        Args: {
          "": string
        }
        Returns: string
      }
      vector_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
    }
    Enums: {
      document_processing_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
      facility_role: "owner" | "admin" | "staff"
      function_type: "Form" | "Procedure" | "Corrective Action"
      message_role: "user" | "assistant" | "system"
      run_status_type:
        | "queued"
        | "in_progress"
        | "requires_action"
        | "cancelling"
        | "cancelled"
        | "failed"
        | "completed"
        | "expired"
      thread_status:
        | "queued"
        | "in_progress"
        | "requires_action"
        | "cancelling"
        | "cancelled"
        | "failed"
        | "completed"
        | "expired"
      vector_store_status: "processing" | "ready" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
