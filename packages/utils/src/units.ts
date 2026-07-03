/**
 * Unit conversion helpers. Internal layout calculations use points (pt) as
 * the single normalized unit (docs/02-architecture/layout-engine.md).
 */

const POINTS_PER_INCH = 72;
const POINTS_PER_CM = 72 / 2.54;
const TWIPS_PER_POINT = 20;
/** English Metric Units, used by OpenXML drawings. */
const EMU_PER_POINT = 12700;

export function inchesToPoints(inches: number): number {
  return inches * POINTS_PER_INCH;
}

export function centimetersToPoints(cm: number): number {
  return cm * POINTS_PER_CM;
}

export function millimetersToPoints(mm: number): number {
  return (mm / 10) * POINTS_PER_CM;
}

export function pointsToTwips(points: number): number {
  return Math.round(points * TWIPS_PER_POINT);
}

export function pointsToEmu(points: number): number {
  return Math.round(points * EMU_PER_POINT);
}

/** Word half-point font size unit. */
export function pointsToHalfPoints(points: number): number {
  return Math.round(points * 2);
}
