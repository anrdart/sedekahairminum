// Shared, typed marketing-content queries used by the build-time static pages.
// One place owns the column selection + ordering so every page is consistent.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, HeroSlide, Stat, Feature, ProgramSlide, GalleryItem, Testimonial, Faq, Penerima, ValueItem, TeamMember, Misi, Rekening } from '../types';

type DB = SupabaseClient<Database>;
type MaybeDB = DB | null;

// When supabaseStatic is null (no env configured), every query returns [].
// This lets `bun run build` succeed before Supabase is set up.

export async function getHeroSlides(client: MaybeDB): Promise<HeroSlide[]> {
  if (!client) return [];
  const { data } = await client.from('hero_slides').select('*').eq('is_published', true).order('sort_order');
  return (data ?? []) as HeroSlide[];
}
export async function getStats(client: MaybeDB, grp: 'home' | 'penerima'): Promise<Stat[]> {
  if (!client) return [];
  const { data } = await client.from('stats').select('*').eq('is_published', true).eq('grp', grp).order('sort_order');
  return (data ?? []) as Stat[];
}
export async function getFeatures(client: MaybeDB): Promise<Feature[]> {
  if (!client) return [];
  const { data } = await client.from('features').select('*').eq('is_published', true).order('sort_order');
  return (data ?? []) as Feature[];
}
export async function getProgramSlides(client: MaybeDB): Promise<ProgramSlide[]> {
  if (!client) return [];
  const { data } = await client.from('program_slides').select('*').eq('is_published', true).order('sort_order');
  return (data ?? []) as ProgramSlide[];
}
export async function getGallery(client: MaybeDB): Promise<GalleryItem[]> {
  if (!client) return [];
  const { data } = await client.from('gallery').select('*').eq('is_published', true).order('sort_order');
  return (data ?? []) as GalleryItem[];
}
export async function getTestimonials(client: MaybeDB): Promise<Testimonial[]> {
  if (!client) return [];
  const { data } = await client.from('testimonials').select('*').eq('is_published', true).order('sort_order');
  return (data ?? []) as Testimonial[];
}
export async function getFaqs(client: MaybeDB): Promise<Faq[]> {
  if (!client) return [];
  const { data } = await client.from('faqs').select('*').eq('is_published', true).order('sort_order');
  return (data ?? []) as Faq[];
}
export async function getPenerima(client: MaybeDB): Promise<Penerima[]> {
  if (!client) return [];
  const { data } = await client.from('penerima').select('*').eq('is_published', true).order('sort_order');
  return (data ?? []) as Penerima[];
}
export async function getValues(client: MaybeDB): Promise<ValueItem[]> {
  if (!client) return [];
  const { data } = await client.from('values_list').select('*').eq('is_published', true).order('sort_order');
  return (data ?? []) as ValueItem[];
}
export async function getTeam(client: MaybeDB): Promise<TeamMember[]> {
  if (!client) return [];
  const { data } = await client.from('team').select('*').eq('is_published', true).order('sort_order');
  return (data ?? []) as TeamMember[];
}
export async function getMisi(client: MaybeDB): Promise<Misi[]> {
  if (!client) return [];
  const { data } = await client.from('misi').select('*').eq('is_published', true).order('sort_order');
  return (data ?? []) as Misi[];
}
export async function getRekening(client: MaybeDB): Promise<Rekening[]> {
  if (!client) return [];
  const { data } = await client.from('rekening').select('*').eq('is_published', true).order('sort_order');
  return (data ?? []) as Rekening[];
}

export type SettingsMap = Record<string, Record<string, unknown>>;
export async function getSettings(client: MaybeDB): Promise<SettingsMap> {
  if (!client) return {};
  const { data } = await client.from('settings').select('key, value');
  const rows = (data ?? []) as Array<{ key: string; value: Record<string, unknown> | null }>;
  const map: SettingsMap = {};
  for (const row of rows) map[row.key] = row.value ?? {};
  return map;
}
