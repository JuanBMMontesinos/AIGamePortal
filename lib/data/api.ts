import { createServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { Category, Post } from "@/types/database";
import { MOCK_CATEGORIES, MOCK_POSTS } from "./mock-news";

export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured) {
    return MOCK_CATEGORIES;
  }

  try {
    const supabase = createServerClient();
    if (!supabase) return MOCK_CATEGORIES;

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error || !data || data.length === 0) {
      return MOCK_CATEGORIES;
    }

    return data as Category[];
  } catch {
    return MOCK_CATEGORIES;
  }
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) || null;
}

export async function getLatestPosts(limit: number = 12): Promise<Post[]> {
  if (!isSupabaseConfigured) {
    return MOCK_POSTS.slice(0, limit);
  }

  try {
    const supabase = createServerClient();
    if (!supabase) return MOCK_POSTS.slice(0, limit);

    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        categories (*),
        sources (*)
      `)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error || !data || data.length === 0) {
      return MOCK_POSTS.slice(0, limit);
    }

    return data as Post[];
  } catch {
    return MOCK_POSTS.slice(0, limit);
  }
}

export async function getTrendingPosts(limit: number = 5): Promise<Post[]> {
  if (!isSupabaseConfigured) {
    return [...MOCK_POSTS]
      .sort((a, b) => b.views_count - a.views_count)
      .slice(0, limit);
  }

  try {
    const supabase = createServerClient();
    if (!supabase) {
      return [...MOCK_POSTS]
        .sort((a, b) => b.views_count - a.views_count)
        .slice(0, limit);
    }

    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        categories (*),
        sources (*)
      `)
      .eq("status", "published")
      .order("views_count", { ascending: false })
      .limit(limit);

    if (error || !data || data.length === 0) {
      return [...MOCK_POSTS]
        .sort((a, b) => b.views_count - a.views_count)
        .slice(0, limit);
    }

    return data as Post[];
  } catch {
    return [...MOCK_POSTS]
      .sort((a, b) => b.views_count - a.views_count)
      .slice(0, limit);
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (!isSupabaseConfigured) {
    const found = MOCK_POSTS.find((p) => p.slug === slug);
    return found || null;
  }

  try {
    const supabase = createServerClient();
    if (!supabase) {
      return MOCK_POSTS.find((p) => p.slug === slug) || null;
    }

    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        categories (*),
        sources (*)
      `)
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error || !data) {
      const fallback = MOCK_POSTS.find((p) => p.slug === slug);
      return fallback || null;
    }

    return data as Post;
  } catch {
    return MOCK_POSTS.find((p) => p.slug === slug) || null;
  }
}

export async function getPostsByCategory(
  categorySlug: string,
  limit: number = 20
): Promise<{ category: Category | null; posts: Post[] }> {
  const category = await getCategoryBySlug(categorySlug);

  if (!isSupabaseConfigured || !category) {
    const filtered = MOCK_POSTS.filter(
      (p) => p.categories?.slug === categorySlug || p.category_id === category?.id
    );
    return { category, posts: filtered.slice(0, limit) };
  }

  try {
    const supabase = createServerClient();
    if (!supabase) {
      const filtered = MOCK_POSTS.filter(
        (p) => p.categories?.slug === categorySlug || p.category_id === category.id
      );
      return { category, posts: filtered.slice(0, limit) };
    }

    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        categories (*),
        sources (*)
      `)
      .eq("category_id", category.id)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error || !data || data.length === 0) {
      const filtered = MOCK_POSTS.filter(
        (p) => p.categories?.slug === categorySlug || p.category_id === category.id
      );
      return { category, posts: filtered.slice(0, limit) };
    }

    return { category, posts: data as Post[] };
  } catch {
    const filtered = MOCK_POSTS.filter(
      (p) => p.categories?.slug === categorySlug || p.category_id === category?.id
    );
    return { category, posts: filtered.slice(0, limit) };
  }
}

export async function getAllPostSlugs(): Promise<{ slug: string }[]> {
  if (!isSupabaseConfigured) {
    return MOCK_POSTS.map((p) => ({ slug: p.slug }));
  }

  try {
    const supabase = createServerClient();
    if (!supabase) return MOCK_POSTS.map((p) => ({ slug: p.slug }));

    const { data } = await supabase
      .from("posts")
      .select("slug")
      .eq("status", "published");

    if (!data || data.length === 0) {
      return MOCK_POSTS.map((p) => ({ slug: p.slug }));
    }

    return data;
  } catch {
    return MOCK_POSTS.map((p) => ({ slug: p.slug }));
  }
}

export async function getAllCategorySlugs(): Promise<{ slug: string }[]> {
  const categories = await getCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export interface SitemapPostItem {
  slug: string;
  updated_at: string;
  published_at: string;
}

export async function getAllPostsForSitemap(): Promise<SitemapPostItem[]> {
  if (!isSupabaseConfigured) {
    return MOCK_POSTS.map((p) => ({
      slug: p.slug,
      updated_at: p.updated_at || p.published_at,
      published_at: p.published_at,
    }));
  }

  try {
    const supabase = createServerClient();
    if (!supabase) {
      return MOCK_POSTS.map((p) => ({
        slug: p.slug,
        updated_at: p.updated_at || p.published_at,
        published_at: p.published_at,
      }));
    }

    const { data, error } = await supabase
      .from("posts")
      .select("slug, updated_at, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return MOCK_POSTS.map((p) => ({
        slug: p.slug,
        updated_at: p.updated_at || p.published_at,
        published_at: p.published_at,
      }));
    }

    return data as SitemapPostItem[];
  } catch {
    return MOCK_POSTS.map((p) => ({
      slug: p.slug,
      updated_at: p.updated_at || p.published_at,
      published_at: p.published_at,
    }));
  }
}

export interface NewsSitemapPostItem {
  slug: string;
  title: string;
  published_at: string;
}

export async function getRecentPostsForNewsSitemap(
  hours: number = 48
): Promise<NewsSitemapPostItem[]> {
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  const cutoffIso = cutoffTime.toISOString();

  if (!isSupabaseConfigured) {
    const recentMocks = MOCK_POSTS.filter(
      (p) => new Date(p.published_at).getTime() >= cutoffTime.getTime()
    );

    const postsToUse = recentMocks.length > 0 ? recentMocks : MOCK_POSTS.slice(0, 5);
    return postsToUse.map((p) => ({
      slug: p.slug,
      title: p.title,
      published_at: p.published_at,
    }));
  }

  try {
    const supabase = createServerClient();
    if (!supabase) {
      return MOCK_POSTS.slice(0, 5).map((p) => ({
        slug: p.slug,
        title: p.title,
        published_at: p.published_at,
      }));
    }

    const { data, error } = await supabase
      .from("posts")
      .select("slug, title, published_at")
      .eq("status", "published")
      .gte("published_at", cutoffIso)
      .order("published_at", { ascending: false })
      .limit(1000);

    if (error || !data) {
      return [];
    }

    return data as NewsSitemapPostItem[];
  } catch {
    return [];
  }
}
