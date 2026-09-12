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

  // Joined relations
  categories?: Category | null;
  sources?: Source | null;
}

export interface Database {
  public: {
    Tables: {
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
      posts: {
        Row: Post;
        Insert: Omit<Post, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Post>;
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

