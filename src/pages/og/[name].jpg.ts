// Share images (CHARTER §3.5, §11), composed at build time with sharp. No text
// in the images: titles and descriptions come from each page's meta tags.
import type { APIRoute, GetStaticPaths } from 'astro';
import sharp from 'sharp';
import { getBrandWork, getPrograms } from '../../lib/content';
import { aboutCard, programCard, siteCard, type OgCard, type Panel } from '../../lib/og';

const W = 1200;
const H = 630;

export const getStaticPaths = (async () => {
  const entries = [...(await getPrograms()), ...(await getBrandWork())];
  const cards: OgCard[] = [await siteCard(), await aboutCard(), ...entries.map(programCard).filter((c): c is OgCard => !!c)];
  return cards.map((card) => ({ params: { name: card.name }, props: { card } }));
}) satisfies GetStaticPaths;

/** A poster at a given height, at its own ratio: never cropped. */
async function poster(path: string, height: number) {
  const buffer = await sharp(path).resize({ height, kernel: 'lanczos3' }).toBuffer();
  const { width = 0 } = await sharp(buffer).metadata();
  return { buffer, width };
}

async function programImage(panel: Panel) {
  const p = await poster(panel.poster, 550);
  return sharp({ create: { width: W, height: H, channels: 3, background: panel.color } }).composite([
    { input: p.buffer, left: Math.round((W - p.width) / 2), top: 40 },
  ]);
}

async function siteImage(panels: Panel[]) {
  // Three panels of 387, 386 and 387px with 20px white gutters.
  const widths = [387, 386, 387];
  const layers: sharp.OverlayOptions[] = [];
  let left = 0;
  for (const [i, panel] of panels.entries()) {
    const width = widths[i] ?? 386;
    layers.push({ input: { create: { width, height: H, channels: 3, background: panel.color } }, left, top: 0 });
    const p = await poster(panel.poster, 400);
    layers.push({ input: p.buffer, left: left + Math.round((width - p.width) / 2), top: Math.round((H - 400) / 2) });
    left += width + 20;
  }
  return sharp({ create: { width: W, height: H, channels: 3, background: '#ffffff' } }).composite(layers);
}

async function aboutImage(path: string) {
  // The full width of the portrait, in a 1.905:1 window centred 41% of the way down.
  const { width = 0, height = 0 } = await sharp(path).metadata();
  const windowHeight = Math.round(width / (W / H));
  const top = Math.max(0, Math.min(height - windowHeight, Math.round(height * 0.41 - windowHeight / 2)));
  return sharp(path).extract({ left: 0, top, width, height: windowHeight }).resize(W, H, { kernel: 'lanczos3' });
}

export const GET: APIRoute = async ({ props }) => {
  const card = props.card as OgCard;
  const image =
    card.kind === 'program' ? await programImage(card.panel) : card.kind === 'site' ? await siteImage(card.panels) : await aboutImage(card.portrait);
  const jpeg = await image.jpeg({ quality: 86, mozjpeg: true, chromaSubsampling: '4:4:4' }).toBuffer();
  return new Response(new Uint8Array(jpeg), { headers: { 'Content-Type': 'image/jpeg' } });
};
