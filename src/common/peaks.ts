import { float, int, Unhandled } from "./lang.ts"
import { Option } from "./option.ts"
import { Arrays } from "./arrays.ts"
import { Float16 } from "./floats.ts"

export namespace Peaks {
    export const findBestShifts = (numFrames: int, width: int = 1600): Option<Uint8Array> => {
        const ShiftPadding = 6
        const ratio = numFrames / width
        if (ratio <= 1.0) {
            return Option.None
        }
        const maxShift = Math.floor(Math.log(ratio) / Math.log(2.0))
        const numStages = Math.max(1, Math.floor(maxShift / ShiftPadding))
        return Option.wrap(new Uint8Array(Arrays.create(index => ShiftPadding * (index + 1), numStages)))
    }

    export class Stages {
        static readonly None = new Stages([], [], 0)

        constructor(readonly stages: Stage[], readonly data: Int32Array[], readonly numFrames: int) {}

        nearest(unitsPerPixel: number): Stage | null {
            if (this.stages.length === 0) {
                return null
            }
            const shift = Math.floor(Math.log(Math.abs(unitsPerPixel)) / Math.log(2.0))
            let i = this.stages.length
            while (--i > -1) {
                if (shift >= this.stages[i].shift) {
                    return this.stages[i]
                }
            }
            return this.stages[0]
        }

        minRatio(): number {
            return this.stages.length === 0 ? Number.POSITIVE_INFINITY : 1 << this.stages[0].shift
        }

        toString(): string {
            return `{Memory numStages: ${this.stages.length}}`
        }
    }

    export class Stage {
        constructor(readonly mask: int, readonly shift: int, readonly numPeaks: int, readonly dataOffset: int) {}

        unitsEachPeak(): int {return 1 << this.shift}
    }

    const initStages = (shifts: Uint8Array, numFrames: int): [Stage[], int] => {
        let dataOffset = 0
        const stages = Arrays.create((index: int) => {
            const shift = shifts[index]
            const numPeaks = Math.ceil(numFrames / (1 << shift))
            const stage = new Stage((1 << shift) - 1, shift, numPeaks, dataOffset)
            dataOffset += numPeaks
            return stage
        }, shifts.length)
        return [stages, dataOffset]
    }

    const pack = (f0: float, f1: float): int => {
        const bits0 = Float16.floatToIntBits(f0)
        const bits1 = Float16.floatToIntBits(f1)
        return bits0 | (bits1 << 16)
    }

    export const unpack = (bits: int, index: 0 | 1): float => {
        switch (index) {
            case 0:
                return Float16.intBitsToFloat(bits)
            case 1:
                return Float16.intBitsToFloat(bits >> 16)
            default:
                return Unhandled(index)
        }
    }
}
