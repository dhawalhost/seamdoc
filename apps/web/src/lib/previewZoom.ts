/** Discrete zoom levels for the live preview (Module 2 — Live Preview). */
export const PREVIEW_ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export type PreviewZoom = (typeof PREVIEW_ZOOM_LEVELS)[number];

export function stepPreviewZoom(current: number, direction: 'in' | 'out'): PreviewZoom {
  const index = PREVIEW_ZOOM_LEVELS.findIndex((level) => level >= current - 0.001);
  const base = index === -1 ? 0 : index;
  if (direction === 'in') {
    return PREVIEW_ZOOM_LEVELS[Math.min(PREVIEW_ZOOM_LEVELS.length - 1, base + 1)] ?? 2;
  }
  return PREVIEW_ZOOM_LEVELS[Math.max(0, base - 1)] ?? 0.5;
}

export function formatPreviewZoom(zoom: number): string {
  return `${Math.round(zoom * 100)}%`;
}
