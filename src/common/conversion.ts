// noinspection JSUnusedGlobalSymbols

const LogDb = Math.log(10.0) / 20.0

export const midiToHz = (note: number = 60.0, baseFrequency: number = 440.0): number => baseFrequency * Math.pow(2.0, (note + 3.0) / 12.0 - 6.0)
export const hzToMidi = (hz: number, baseFrequency: number): number => (12.0 * Math.log(hz / baseFrequency) + 69.0 * Math.LN2) / Math.LN2
export const dbToGain = (db: number): number => Math.exp(db * LogDb)
export const gainToDb = (gain: number): number => Math.log(gain) / LogDb
export const barsToNumFrames = (bars: number, bpm: number, samplingRate: number): number => (bars * samplingRate * 240.0) / bpm
export const secondsToBars = (seconds: number, bpm: number): number => seconds * bpm / 240.0
export const numFramesToBars = (numFrames: number, bpm: number, samplingRate: number): number => (numFrames * bpm) / (samplingRate * 240.0)
export const barsToSeconds = (bars: number, bpm: number): number => (bars * 240.0) / bpm