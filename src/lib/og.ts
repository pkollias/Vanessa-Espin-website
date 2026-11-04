// Share cards (CHARTER §3.5, §11): which 1200×630 image each page uses, and its
// file name. Names carry a hash of their source images and layout, so a new
// poster gives a new URL and LinkedIn, Slack and iMessage fetch it fresh.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { ImageMetadata } from 'astro';
import { getEntry } from 'astro:content';
import { getPrograms, type Project } from './content';

const LAYOUT = 'OG_LAYOUT=1';

export type Panel = { poster: string; color: string };
export type OgCard =
  | { kind: 'program'; name: string; panel: Panel }
  | { kind: 'site'; name: string; panels: Panel[] }
  | { kind: 'about'; name: string; portrait: string };

const fsPath = (img: ImageMetadata) => (img as ImageMetadata & { fsPath: string }).fsPath;

const hash = (...parts: Array<string | Buffer>) => {
  const h = createHash('sha256');
  for (const p of parts) h.update(p);
  return h.digest('hex').slice(0, 8);
};

/** A program's poster on its panel color; null when it has no poster. */
export function programCard(entry: Project): OgCard | null {
  if (!entry.data.poster) return null;
  const panel = { poster: fsPath(entry.data.poster), color: entry.data.cover.panelColor };
  const base = entry.collection === 'programs' ? entry.id : `brand-${entry.id}`;
  return { kind: 'program', name: `${base}.${hash(readFileSync(panel.poster), panel.color, LAYOUT)}`, panel };
}

/** The three newest posters side by side, each on its own color. */
export async function siteCard(): Promise<OgCard> {
  const programs = (await getPrograms()).filter((p) => p.data.poster).slice(0, 3);
  const panels = programs.map((p) => ({ poster: fsPath(p.data.poster!), color: p.data.cover.panelColor }));
  return { kind: 'site', name: `site.${hash(...panels.flatMap((p) => [readFileSync(p.poster), p.color]), LAYOUT)}`, panels };
}

/** The About portrait, cropped to the card. */
export async function aboutCard(): Promise<OgCard> {
  const about = await getEntry('pages', 'about');
  if (!about) throw new Error('Missing src/content/pages/about.md');
  const portrait = fsPath(about.data.portrait);
  return { kind: 'about', name: `about.${hash(readFileSync(portrait), LAYOUT)}`, portrait };
}

export const ogPath = (card: OgCard) => `/og/${card.name}.jpg`;

/** The card for a program or brand work page, falling back to the site card. */
export const cardFor = async (entry: Project) => programCard(entry) ?? (await siteCard());
