import { describe, expect, it } from 'vitest';
import { formatPreviewZoom, stepPreviewZoom } from './previewZoom.js';

describe('previewZoom', () => {
  it('steps through discrete zoom levels', () => {
    expect(stepPreviewZoom(1, 'in')).toBe(1.25);
    expect(stepPreviewZoom(1, 'out')).toBe(0.75);
    expect(stepPreviewZoom(0.5, 'out')).toBe(0.5);
    expect(stepPreviewZoom(2, 'in')).toBe(2);
  });

  it('formats zoom as a percentage label', () => {
    expect(formatPreviewZoom(1)).toBe('100%');
    expect(formatPreviewZoom(1.25)).toBe('125%');
  });
});
