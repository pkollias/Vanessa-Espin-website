// Responsive image slots (design spec A16): the widths to generate and the
// sizes the browser should pick from, for every place an image appears. Sizes
// follow the layout thresholds in src/styles/tokens.css. Astro never upscales,
// so widths above the source's own are dropped.
import type { ImageMetadata } from 'astro';

declare const __INDEXABLE__: boolean;

type Slot = { widths: number[]; sizes: string; minSource: number };

export const SLOTS = {
  coverPoster: {
    widths: [240, 324, 480, 648, 972],
    sizes: '(max-width: 487.98px) calc(80vw - 67px), 324px',
    minSource: 968,
  },
  coverPhoto: {
    widths: [334, 668],
    sizes: '(max-width: 767px) calc(100vw - 417px), (max-width: 1239px) calc(60vw - 410px), 334px',
    minSource: 668,
  },
  gridCell: {
    widths: [216, 432],
    sizes: '(max-width: 767px) calc(33.33vw - 35px), (max-width: 1239px) calc(20vw - 32px), 216px',
    minSource: 432,
  },
  projectPosterPair: {
    widths: [360, 483, 720, 968],
    sizes: '(max-width: 527px) calc(100vw - 48px), (max-width: 783px) calc(41.67vw - 27px), (max-width: 1239px) calc(40vw - 14px), 483px',
    minSource: 968,
  },
  projectPosterSolo: {
    widths: [360, 483, 720, 968],
    sizes: '(max-width: 530px) calc(100vw - 48px), 483px',
    minSource: 968,
  },
  projectPhoto: {
    widths: [694, 1040, 1388],
    sizes: '(max-width: 527px) calc(100vw - 48px), (max-width: 783px) calc(58.33vw - 37px), (max-width: 1239px) calc(60vw - 50px), 694px',
    minSource: 1388,
  },
  galleryTile: {
    widths: [388, 580, 776, 960],
    sizes: '(max-width: 527px) calc(100vw - 48px), (max-width: 979px) calc(50vw - 32px), (max-width: 1239px) calc(33.33vw - 27px), 387px',
    minSource: 960,
  },
  thumb: {
    widths: [72, 144, 216],
    sizes: '72px',
    minSource: 216,
  },
  portrait: {
    widths: [480, 720, 960],
    sizes: '(max-width: 488px) calc(100vw - 48px), (max-width: 747px) 440px, (max-width: 843px) calc(43.24vw - 45px), (max-width: 1239px) calc(40vw - 18px), 479px',
    minSource: 960,
  },
} satisfies Record<string, Slot>;

export type SlotName = keyof typeof SLOTS;

const reported = new Set<string>();

/**
 * The widths and sizes for an image in a slot. Flags a source too small for
 * the slot on a 2x screen: a warning in previews (the list of originals to
 * get), an error in the launch build (CHARTER §17: no web-size stand-ins).
 */
export function slot(name: SlotName, image: ImageMetadata) {
  const s = SLOTS[name];
  if (image.width < s.minSource) {
    const file = (image as ImageMetadata & { fsPath?: string }).fsPath?.replace(/^.*\/src\//, 'src/') ?? image.src;
    const message = `${file} is ${image.width}px wide; the ${name} slot needs ${s.minSource}px for sharp 2x screens.`;
    if (__INDEXABLE__) throw new Error(`Launch build blocked: ${message}`);
    if (!reported.has(message)) {
      reported.add(message);
      console.warn(`[images] ${message}`);
    }
  }
  return { widths: s.widths, sizes: s.sizes };
}

/** A poster's own aspect ratio, so it is never cropped. */
export const ratio = (image: ImageMetadata) => (image.width / image.height).toFixed(4);
