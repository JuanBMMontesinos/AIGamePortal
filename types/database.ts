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

export interface FreeGameHistory {
  id: string;
  deal_id: string;
  title: string;
  platform: string | null;
  worth: string | null;
  giveaway_url: string | null;
  image_url: string | null;
  expires_at: string | null;
  posted_at: string;
  created_at: string;
}

export interface DiscordSettings {
  id: string;
  is_deals_enabled: boolean;
  is_news_enabled: boolean;
  deals_disabled_reason: string | null;
  news_disabled_reason: string | null;
  deals_webhook_url?: string | null;
  news_webhook_url?: string | null;
  last_deals_dispatched_at: string | null;
  last_deals_dispatch_status: "idle" | "success" | "failed" | "skipped" | string;
  last_deals_dispatch_log: string | null;
  last_news_dispatched_at: string | null;
  last_news_dispatch_status: "idle" | "success" | "failed" | "skipped" | string;
  last_news_dispatch_log: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialSettings {
  id: string;
  is_twitter_enabled: boolean;
  is_telegram_enabled: boolean;
  twitter_disabled_reason: string | null;
  telegram_disabled_reason: string | null;
  last_twitter_dispatched_at: string | null;
  last_twitter_dispatch_status: "idle" | "success" | "failed" | "skipped" | string;
  last_twitter_dispatch_log: string | null;
  last_telegram_dispatched_at: string | null;
  last_telegram_dispatch_status: "idle" | "success" | "failed" | "skipped" | string;
  last_telegram_dispatch_log: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// SISTEMA CENTRALIZADO DE LOGS & AUDITORIA DE IA (FASE 1)
// ============================================================================

export type LogService =
  | "ai_writer"
  | "ai_embedding"
  | "ai_hub"
  | "social_x"
  | "social_telegram"
  | "social_discord"
  | "social_instagram"
  | "rss_scraper"
  | "game_enricher"
  | "affiliate_sync"
  | "newsletter"
  | "database"
  | "system"
  | (string & {});

export type LogLevel = "info" | "warn" | "error" | "critical";

export type LogStatus = "success" | "failed" | "skipped" | "aborted" | "retry_exhausted";

export type FailureReasonCode =
  | "GEMINI_QUOTA_EXCEEDED"
  | "GEMINI_SAFETY_BLOCK"
  | "GEMINI_FALLBACK_EXHAUSTED"
  | "GEMINI_GENERATION_FAILED"
  | "EMBEDDING_ALL_MODELS_FAILED"
  | "JSON_SCHEMA_INVALID"
  | "CONTENT_TOO_SHORT"
  | "RSS_FEED_UNREACHABLE"
  | "TWITTER_CREDITS_DEPLETED"
  | "TWITTER_FORBIDDEN_403"
  | "TWITTER_RATE_LIMITED"
  | "TWITTER_NOT_CONFIGURED"
  | "TELEGRAM_PARSE_ERROR"
  | "TELEGRAM_TIMEOUT_ERROR"
  | "TELEGRAM_BLOCKED_ERROR"
  | "TELEGRAM_NOT_CONFIGURED"
  | "DISCORD_WEBHOOK_ERROR"
  | "DISCORD_BAD_REQUEST_400"
  | "DISCORD_NOT_FOUND_404"
  | "DISCORD_RATE_LIMITED"
  | "INSTAGRAM_API_ERROR"
  | "INSTAGRAM_NOT_CONFIGURED"
  | "GAMERPOWER_API_ERROR"
  | "RESEND_BATCH_ERROR"
  | "RESEND_KEY_MISSING"
  | "PGVECTOR_RPC_ERROR"
  | "DATABASE_INSERT_ERROR"
  | "HUB_SUGGESTION_FAILED"
  | (string & {});

export interface AISystemLog {
  id: string;
  created_at: string;
  service: LogService;
  action: string;
  level: LogLevel;
  status: LogStatus;
  task_completed: boolean;
  failure_reason_code: FailureReasonCode | null;
  message: string;
  error_details: string | null;
  metadata: Record<string, any>;
  is_retryable: boolean;
  repeat_count: number;
  resolved_at: string | null;
  resolved_by: string | null;
}

export interface LogKPIs {
  total_logs: number;
  total_failures: number;
  failure_rate_percentage: number;
  incomplete_tasks: number;
  critical_errors: number;
  top_failure_reasons: { reason: FailureReasonCode; count: number }[];
  services_health: { service: LogService; success_count: number; failure_count: number }[];
}

export interface LogFilterParams {
  service?: LogService;
  level?: LogLevel;
  status?: LogStatus;
  task_completed?: boolean;
  failure_reason_code?: FailureReasonCode;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface Database {
  public: {
    Tables: {
      ai_system_logs: {
        Row: AISystemLog;
        Insert: {
          id?: string;
          created_at?: string;
          service: LogService;
          action: string;
          level: LogLevel;
          status: LogStatus;
          task_completed?: boolean;
          failure_reason_code?: FailureReasonCode | null;
          message: string;
          error_details?: string | null;
          metadata?: Record<string, any> | Json;
          is_retryable?: boolean;
          repeat_count?: number;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          service?: LogService;
          action?: string;
          level?: LogLevel;
          status?: LogStatus;
          task_completed?: boolean;
          failure_reason_code?: FailureReasonCode | null;
          message?: string;
          error_details?: string | null;
          metadata?: Record<string, any> | Json;
          is_retryable?: boolean;
          repeat_count?: number;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
        Relationships: [];
      };
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
      free_games_history: {
        Row: FreeGameHistory;
        Insert: {
          id?: string;
          deal_id: string;
          title: string;
          platform?: string | null;
          worth?: string | null;
          giveaway_url?: string | null;
          image_url?: string | null;
          expires_at?: string | null;
          posted_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          deal_id?: string;
          title?: string;
          platform?: string | null;
          worth?: string | null;
          giveaway_url?: string | null;
          image_url?: string | null;
          expires_at?: string | null;
          posted_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      discord_settings: {
        Row: DiscordSettings;
        Insert: {
          id?: string;
          is_deals_enabled?: boolean;
          is_news_enabled?: boolean;
          deals_disabled_reason?: string | null;
          news_disabled_reason?: string | null;
          deals_webhook_url?: string | null;
          news_webhook_url?: string | null;
          last_deals_dispatched_at?: string | null;
          last_deals_dispatch_status?: string;
          last_deals_dispatch_log?: string | null;
          last_news_dispatched_at?: string | null;
          last_news_dispatch_status?: string;
          last_news_dispatch_log?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          is_deals_enabled?: boolean;
          is_news_enabled?: boolean;
          deals_disabled_reason?: string | null;
          news_disabled_reason?: string | null;
          deals_webhook_url?: string | null;
          news_webhook_url?: string | null;
          last_deals_dispatched_at?: string | null;
          last_deals_dispatch_status?: string;
          last_deals_dispatch_log?: string | null;
          last_news_dispatched_at?: string | null;
          last_news_dispatch_status?: string;
          last_news_dispatch_log?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      social_settings: {
        Row: SocialSettings;
        Insert: {
          id?: string;
          is_twitter_enabled?: boolean;
          is_telegram_enabled?: boolean;
          twitter_disabled_reason?: string | null;
          telegram_disabled_reason?: string | null;
          last_twitter_dispatched_at?: string | null;
          last_twitter_dispatch_status?: string;
          last_twitter_dispatch_log?: string | null;
          last_telegram_dispatched_at?: string | null;
          last_telegram_dispatch_status?: string;
          last_telegram_dispatch_log?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          is_twitter_enabled?: boolean;
          is_telegram_enabled?: boolean;
          twitter_disabled_reason?: string | null;
          telegram_disabled_reason?: string | null;
          last_twitter_dispatched_at?: string | null;
          last_twitter_dispatch_status?: string;
          last_twitter_dispatch_log?: string | null;
          last_telegram_dispatched_at?: string | null;
          last_telegram_dispatch_status?: string;
          last_telegram_dispatch_log?: string | null;
          created_at?: string;
          updated_at?: string;
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
      purge_old_system_logs: {
        Args: {
          days_to_keep?: number;
        };
        Returns: number;
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

