/**
 * Image privacy policy for the web preview (ADR 0006).
 *
 * Remote and relative URLs must not trigger browser fetches; only embedded
 * data URLs are safe to render as pixels.
 */

export function isEmbeddableImageSrc(src: string): boolean {
  return src.startsWith('data:image/');
}

/** Matches DOCX exporter placeholder text (packages/exporters/docx). */
export function imagePlaceholderLabel(alt: string): string {
  return alt === '' ? '[image]' : `[${alt}]`;
}
