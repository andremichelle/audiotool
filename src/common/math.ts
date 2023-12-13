export const clamp = (value: number, min: number = 0.0, max: number = 1.0): number => Math.min(Math.max(min, value), max)