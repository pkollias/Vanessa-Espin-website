import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { withBase } from './paths';
import { SHOW_TODOS } from './todo';

export type Project = CollectionEntry<'programs'> | CollectionEntry<'brandWork'>;

const newestFirst = (a: Project, b: Project) => b.data.dateStart.getTime() - a.data.dateStart.getTime();

// Drafts (e.g. Enchante) show in review builds only.
const published = (e: Project) => SHOW_TODOS || !e.data.draft;

export async function getPrograms() {
  return (await getCollection('programs', published)).sort(newestFirst);
}

export async function getBrandWork() {
  return (await getCollection('brandWork', published)).sort(newestFirst);
}

export async function getSite() {
  const entry = await getEntry('site', 'site');
  if (!entry) throw new Error('src/content/site.yaml needs a top-level `site:` key');
  return entry.data;
}

/** URL of a program or brand work page. */
export const projectHref = (entry: Project) =>
  withBase(entry.collection === 'programs' ? `/programs/${entry.id}` : `/brand-work/${entry.id}`);
