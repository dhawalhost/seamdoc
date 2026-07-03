import { describe, expect, it } from 'vitest';
import {
  centimetersToPoints,
  inchesToPoints,
  millimetersToPoints,
  pointsToEmu,
  pointsToHalfPoints,
  pointsToTwips,
} from './units.js';

describe('units', () => {
  it('converts inches to points', () => {
    expect(inchesToPoints(1)).toBe(72);
  });

  it('converts centimeters to points', () => {
    expect(centimetersToPoints(2.54)).toBeCloseTo(72);
  });

  it('converts millimeters to points', () => {
    expect(millimetersToPoints(25.4)).toBeCloseTo(72);
  });

  it('converts points to twips', () => {
    expect(pointsToTwips(12)).toBe(240);
  });

  it('converts points to EMU', () => {
    expect(pointsToEmu(1)).toBe(12700);
  });

  it('converts points to half-points', () => {
    expect(pointsToHalfPoints(11)).toBe(22);
  });
});
