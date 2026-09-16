export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface GameMetadata {
  game_name?: string;
  platforms?: string[];
  metacritic_score?: number | null;
  release_date?: string | null;
  developer?: string | null;
  publisher?: string | null;
  genre?: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Source {
  id: string;
  name: string;
  feed_url: string;
  website_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  tldr: string[];
  content: string;
  excerpt: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  category_id: string | null;
  source_id: string | null;
  source_original_url: string;
  source_original_title: string | null;
  game_metadata: GameMetadata;
  community_sentiment: string | null;
  embedding?: number[] | string | null;
  status: "draft" | "published" | "archived";
  views_count: number;
  published_at: string;
  created_at: string;
  updated_at: string;

  // Fact-Checking & Confiabilidade (Fase 2)
  is_rumor: boolean;
  reliability_score: number;
  rumor_warning: string | null;

  // Hubs de Jogos Permanentes (Fase 4)
  game_hub_id?: string | null;

  // Joined relations
  categories?: Category | null;
  sources?: Source | null;
  game_hubs?: GameHub | null;
}

export interface GameHub {
  id: string;
  name: string;
  slug: string;
  aliases: string[];
  developer: string;
  publisher: string;
  release_date: string;
  platforms: string[];
  metacritic_score: number | null;
  cover_image_url: string;
  banner_image_url: string;
  synopsis: string;
  created_at: string;
  updated_at?: string;
}

export type AffiliateCategory = "Hardware" | "Console" | "PC" | "Jogo" | "Acessórios";

export interface AffiliateProduct {
  id: string;
  title: string;
  category: AffiliateCategory | string;
  keywords: string[];
  store_name: string;
  affiliate_url: string;
  image_url: string;
  price_estimate: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AffiliateClick {
  id: string;
  product_id: string;
  post_id: string | null;
  referrer: string | null;
  user_agent: string | null;
  clicked_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  is_active: boolean;
  subscribed_at: string;
  unsubscribed_at: string | null;
}

export interface NewsletterSettings {
  id: string;
  is_enabled: boolean;
  disabled_reason: string | null;
  sender_name: string;
  sender_email: string;
  test_recipient_email?: string | null;
  last_dispatched_at: string | null;
  last_dispatch_status: "idle" | "success" | "failed" | "skipped" | string;
  last_dispatch_log: string | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      newsletter_settings: {
        Row: NewsletterSettings;
        Insert: {
          id?: string;
          is_enabled?: boolean;
          disabled_reason?: string | null;
          sender_name?: string;
          sender_email?: string;
          test_recipient_email?: string | null;
          last_dispatched_at?: string | null;
          last_dispatch_status?: string;
          last_dispatch_log?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          is_enabled?: boolean;
          disabled_reason?: string | null;
          sender_name?: string;
          sender_email?: string;
          test_recipient_email?: string | null;
          last_dispatched_at?: string | null;
          last_dispatch_status?: string;
          last_dispatch_log?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      newsletter_subscribers: {
        Row: NewsletterSubscriber;
        Insert: {
          id?: string;
          email: string;
          is_active?: boolean;
          subscribed_at?: string;
          unsubscribed_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          is_active?: boolean;
          subscribed_at?: string;
          unsubscribed_at?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Category>;
        Relationships: [];
      };
      sources: {
        Row: Source;
        Insert: Omit<Source, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Source>;
        Relationships: [];
      };
      game_hubs: {
        Row: GameHub;
        Insert: Omit<GameHub, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<GameHub>;
        Relationships: [];
      };
      posts: {
        Row: Post;
        Insert: Omit<Post, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Post>;
        Relationships: [
          {
            foreignKeyName: "posts_game_hub_id_fkey";
            columns: ["game_hub_id"];
            isOneToOne: false;
            referencedRelation: "game_hubs";
            referencedColumns: ["id"];
          }
        ];
      };
      affiliate_products: {
        Row: AffiliateProduct;
        Insert: {
          id?: string;
          title: string;
          category: string;
          keywords?: string[];
          store_name: string;
          affiliate_url: string;
          image_url: string;
          price_estimate?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          category?: string;
          keywords?: string[];
          store_name?: string;
          affiliate_url?: string;
          image_url?: string;
          price_estimate?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      affiliate_clicks: {
        Row: AffiliateClick;
        Insert: {
          id?: string;
          product_id: string;
          post_id?: string | null;
          referrer?: string | null;
          user_agent?: string | null;
          clicked_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          post_id?: string | null;
          referrer?: string | null;
          user_agent?: string | null;
          clicked_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      match_recent_articles: {
        Args: {
          query_embedding: number[] | string;
          match_threshold?: number;
          hours_limit?: number;
        };
        Returns: {
          id: string;
          title: string;
          slug: string;
          similarity: number;
          published_at: string;
          source_original_url: string;
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
}

