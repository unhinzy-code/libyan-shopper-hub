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
      addresses: {
        Row: {
          city_id: string | null
          created_at: string
          details: string
          full_name: string
          id: string
          is_default: boolean
          label: string
          phone: string
          user_id: string
        }
        Insert: {
          city_id?: string | null
          created_at?: string
          details?: string
          full_name?: string
          id?: string
          is_default?: boolean
          label?: string
          phone: string
          user_id: string
        }
        Update: {
          city_id?: string | null
          created_at?: string
          details?: string
          full_name?: string
          id?: string
          is_default?: boolean
          label?: string
          phone?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          name: string
          name_en: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          name_en?: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          name_en?: string
          sort_order?: number
        }
        Relationships: []
      }
      cities: {
        Row: {
          active: boolean
          delivery_days: string
          delivery_fee: number
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          delivery_days?: string
          delivery_fee?: number
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          delivery_days?: string
          delivery_fee?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          user_id: string | null
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          image_url: string | null
          name: string
          order_id: string
          price: number
          product_id: string | null
          qty: number
          size: string | null
        }
        Insert: {
          id?: string
          image_url?: string | null
          name: string
          order_id: string
          price: number
          product_id?: string | null
          qty: number
          size?: string | null
        }
        Update: {
          id?: string
          image_url?: string | null
          name?: string
          order_id?: string
          price?: number
          product_id?: string | null
          qty?: number
          size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_details: string
          admin_note: string
          bank: string | null
          city: string
          created_at: string
          customer_name: string
          delivery_fee: number
          id: string
          notes: string
          order_number: number
          payment_method: string
          phone: string
          receipt_url: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          user_id: string
        }
        Insert: {
          address_details?: string
          admin_note?: string
          bank?: string | null
          city: string
          created_at?: string
          customer_name: string
          delivery_fee?: number
          id?: string
          notes?: string
          order_number?: never
          payment_method: string
          phone: string
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          user_id: string
        }
        Update: {
          address_details?: string
          admin_note?: string
          bank?: string | null
          city?: string
          created_at?: string
          customer_name?: string
          delivery_fee?: number
          id?: string
          notes?: string
          order_number?: never
          payment_method?: string
          phone?: string
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          category_id: string | null
          colors: string[]
          created_at: string
          description: string
          featured: boolean
          id: string
          image_url: string | null
          name: string
          old_price: number | null
          price: number
          rating: number
          sizes: string[]
          stock: number
        }
        Insert: {
          active?: boolean
          category_id?: string | null
          colors?: string[]
          created_at?: string
          description?: string
          featured?: boolean
          id?: string
          image_url?: string | null
          name: string
          old_price?: number | null
          price: number
          rating?: number
          sizes?: string[]
          stock?: number
        }
        Update: {
          active?: boolean
          category_id?: string | null
          colors?: string[]
          created_at?: string
          description?: string
          featured?: boolean
          id?: string
          image_url?: string | null
          name?: string
          old_price?: number | null
          price?: number
          rating?: number
          sizes?: string[]
          stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          name: string
          phone: string
          wallet_balance: number
        }
        Insert: {
          created_at?: string
          id: string
          name?: string
          phone: string
          wallet_balance?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string
          wallet_balance?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      attach_receipt: {
        Args: { _order_id: string; _url: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      place_order: {
        Args: {
          _bank: string
          _city_id: string
          _details: string
          _items: Json
          _notes: string
          _payment: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user" | "staff"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
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
    Enums: {
      app_role: ["admin", "user", "staff"],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const
