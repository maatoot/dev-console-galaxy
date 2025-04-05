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
      api_requests: {
        Row: {
          endpoint_path: string
          error: string | null
          id: string
          request_body: Json | null
          request_date: string | null
          request_headers: Json | null
          request_method: string
          request_query: Json | null
          response_body: Json | null
          response_headers: Json | null
          response_time: number | null
          status_code: number | null
          subscription_id: string
        }
        Insert: {
          endpoint_path: string
          error?: string | null
          id?: string
          request_body?: Json | null
          request_date?: string | null
          request_headers?: Json | null
          request_method: string
          request_query?: Json | null
          response_body?: Json | null
          response_headers?: Json | null
          response_time?: number | null
          status_code?: number | null
          subscription_id: string
        }
        Update: {
          endpoint_path?: string
          error?: string | null
          id?: string
          request_body?: Json | null
          request_date?: string | null
          request_headers?: Json | null
          request_method?: string
          request_query?: Json | null
          response_body?: Json | null
          response_headers?: Json | null
          response_time?: number | null
          status_code?: number | null
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_requests_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      apis: {
        Row: {
          authentication: Json | null
          base_url: string
          created_at: string | null
          default_headers: Json | null
          description: string | null
          endpoints: Json | null
          id: string
          logo: string | null
          name: string
          provider_id: string
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          authentication?: Json | null
          base_url: string
          created_at?: string | null
          default_headers?: Json | null
          description?: string | null
          endpoints?: Json | null
          id?: string
          logo?: string | null
          name: string
          provider_id: string
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          authentication?: Json | null
          base_url?: string
          created_at?: string | null
          default_headers?: Json | null
          description?: string | null
          endpoints?: Json | null
          id?: string
          logo?: string | null
          name?: string
          provider_id?: string
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          api_id: string
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_custom: boolean | null
          name: string
          price_monthly: number | null
          price_yearly: number | null
          request_limit: number | null
        }
        Insert: {
          api_id: string
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_custom?: boolean | null
          name: string
          price_monthly?: number | null
          price_yearly?: number | null
          request_limit?: number | null
        }
        Update: {
          api_id?: string
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_custom?: boolean | null
          name?: string
          price_monthly?: number | null
          price_yearly?: number | null
          request_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_plans_api_id_fkey"
            columns: ["api_id"]
            isOneToOne: false
            referencedRelation: "api_analytics"
            referencedColumns: ["api_id"]
          },
          {
            foreignKeyName: "subscription_plans_api_id_fkey"
            columns: ["api_id"]
            isOneToOne: false
            referencedRelation: "apis"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          api_id: string
          api_key: string
          created_at: string | null
          end_date: string | null
          id: string
          plan: string
          start_date: string | null
          status: string | null
          updated_at: string | null
          usage_count: number | null
          usage_limit: number | null
          user_id: string
        }
        Insert: {
          api_id: string
          api_key: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          plan?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          user_id: string
        }
        Update: {
          api_id?: string
          api_key?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          plan?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_api_id_fkey"
            columns: ["api_id"]
            isOneToOne: false
            referencedRelation: "api_analytics"
            referencedColumns: ["api_id"]
          },
          {
            foreignKeyName: "subscriptions_api_id_fkey"
            columns: ["api_id"]
            isOneToOne: false
            referencedRelation: "apis"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      api_analytics: {
        Row: {
          api_id: string | null
          api_name: string | null
          avg_response_time: number | null
          day: string | null
          failed_requests: number | null
          max_response_time: number | null
          provider_id: string | null
          successful_requests: number | null
          total_requests: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      log_api_request: {
        Args: {
          p_subscription_id: string
          p_endpoint_path: string
          p_status_code: number
          p_response_time: number
          p_request_method: string
          p_request_headers?: Json
          p_request_query?: Json
          p_request_body?: Json
          p_response_headers?: Json
          p_response_body?: Json
          p_error?: string
        }
        Returns: string
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
