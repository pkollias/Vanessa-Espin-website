import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';
import { hasTodo } from '../integrations/todo-text.mjs';

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a 6-digit hex color like "#14100E"');

// An image that may not exist yet. A path resolves to the image; a TODO note
// in its place holds the slot until the file arrives.
const pending = (image: () => z.ZodType) =>
  z.preprocess((v) => (hasTodo(v) ? { todo: v } : v), z.union([z.object({ todo: z.string() }), image()]));

// One schema for programs and brand work: both use the cover band and the
// project page template (CHARTER §8.3, §8.4, §9).
const project = ({ image }: { image: () => z.ZodType }) =>
  z.object({
    // The slug names the page and its view transition: lowercase words joined by hyphens.
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase words joined by hyphens'),
    // A role page (EACC, Flywheel) puts the role in its subtitle instead of the facts.
    kind: z.enum(['program', 'role']).default('program'),
    title: z.string().refine((t) => !hasTodo(t), 'A title cannot be a TODO note'),
    titleLang: z.enum(['en', 'es']).default('en'),
    type: z.string(),
    role: z.string(),
    place: z.string().optional(),
    dateStart: z.coerce.date(),
    dateEnd: z.coerce.date().optional(),
    dateLabel: z.string(),
    dateShort: z.string(),
    description: z.string(),
    poster: image().optional(),
    posterAlt: z.string().optional(),
    cover: z.object({
      mode: z.enum(['poster', 'poster+photo', 'grid']),
      panelColor: hex,
      photo: pending(image).optional(),
      photoAlt: z.string().optional(),
      images: z.array(z.object({ image: pending(image), alt: z.string().default('') })).default([]),
      caption: z.string().optional(),
      line: z.string().optional(),
      place: z.string().optional(),
    }),
    venues: z.array(z.string()).default([]),
    artists: z
      .array(z.object({ name: z.string(), craft: z.string(), country: z.string().optional(), note: z.string().optional() }))
      .default([]),
    partners: z.array(z.string()).default([]),
    facts: z
      .array(
        z.union([
          z.object({ label: z.string(), items: z.array(z.string()) }),
          z.object({ label: z.string(), programs: z.array(z.string()) }),
        ]),
      )
      .default([]),
    gallery: z.array(z.object({ image: pending(image), alt: z.string().default(''), caption: z.string() })).default([]),
    embed: z.union([z.object({ url: z.url(), title: z.string() }), z.string()]).nullable().default(null),
    quote: z
      .union([z.object({ text: z.string(), name: z.string(), role: z.string().optional(), lang: z.enum(['en', 'es']).optional() }), z.string()])
      .nullable()
      .default(null),
    credit: z.string().optional(),
    draft: z.boolean().default(false),
  });

const programs = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/programs' }),
  schema: project,
});

const brandWork = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/brand-work' }),
  schema: project,
});

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      statement: z.string(),
      portrait: image(),
      portraitAlt: z.string(),
      artists: z.array(z.string()).default([]),
      partners: z.array(z.string()).default([]),
    }),
});

const site = defineCollection({
  loader: file('src/content/site.yaml'),
  schema: z.object({
    name: z.string(),
    city: z.string(),
    description: z.string(),
    masthead: z.string(),
    brandLink: z.string(),
    email: z.email(),
    instagram: z.string(),
    linkedin: z.url(),
    languages: z.string(),
    resume: z.string(),
    openTo: z.string().nullable(),
    bio: z.string(),
  }),
});

export const collections = { programs, brandWork, pages, site };
