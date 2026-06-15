// Shared article queries for the public blog (SSR) and RSS/sitemap endpoints.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types';

type DB = SupabaseClient<Database>;

export const ARTICLE_CARD_COLS =
  'slug,title,excerpt,cover_image,published_at,reading_time,category:categories(name,slug)';

const nowIso = () => new Date().toISOString();

export interface ArticleListResult {
  articles: ArticleCard[];
  total: number;
  totalPages: number;
  page: number;
}

export interface ArticleCard {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string | null;
  reading_time: number | null;
  category: { name: string; slug: string } | null;
}

export async function listPublishedArticles(
  client: DB,
  { page = 1, perPage = 9, categorySlug }: { page?: number; perPage?: number; categorySlug?: string } = {},
): Promise<ArticleListResult> {
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  let query = client
    .from('articles')
    .select(ARTICLE_CARD_COLS, { count: 'exact' })
    .eq('status', 'published')
    .lte('published_at', nowIso())
    .order('published_at', { ascending: false })
    .range(from, to);
  if (categorySlug) query = query.eq('category.slug', categorySlug);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  const total = count ?? 0;
  return {
    articles: (data ?? []) as unknown as ArticleCard[],
    total,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
    page,
  };
}

export async function getArticleBySlug(client: DB, slug: string) {
  const { data } = await client
    .from('articles')
    .select(
      '*, category:categories(name,slug), article_tags(tag:tags(name,slug)), author:profiles(full_name,avatar_url)',
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .lte('published_at', nowIso())
    .maybeSingle();
  return data as (Database['public']['Tables']['articles']['Row'] & {
    category: { name: string; slug: string } | null;
    article_tags: { tag: { name: string; slug: string } | null }[];
    author: { full_name: string; avatar_url: string | null } | null;
  }) | null;
}

export async function getRelatedArticles(
  client: DB,
  { categoryId, excludeId, limit = 3 }: { categoryId: string | null; excludeId: string; limit?: number },
): Promise<ArticleCard[]> {
  if (!categoryId) return [];
  const { data } = await client
    .from('articles')
    .select(ARTICLE_CARD_COLS)
    .eq('status', 'published')
    .lte('published_at', nowIso())
    .eq('category_id', categoryId)
    .neq('id', excludeId)
    .order('published_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as ArticleCard[];
}

export interface FeedArticle {
  slug: string;
  title: string;
  excerpt: string | null;
  published_at: string | null;
  updated_at: string;
}

export async function getAllPublishedForFeed(client: DB, limit = 50): Promise<FeedArticle[]> {
  const { data } = await client
    .from('articles')
    .select('slug,title,excerpt,published_at,updated_at')
    .eq('status', 'published')
    .lte('published_at', nowIso())
    .order('published_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as FeedArticle[];
}
