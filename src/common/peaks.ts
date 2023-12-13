import { float, int, Unhandled } from "./lang"
import { Arrays } from "./arrays"
import { ByteArrayInput, DataInput } from "./data.ts"
import { Float16 } from "./floats.ts"

export namespace Peaks {
    export const load = async (url: string, n: int): Promise<Array<Peaks.Stages>> => {
        const arrayBuffer = await fetch(url).then(x => x.arrayBuffer())
        let position: int = 0 | 0
        return Arrays.create(() => {
            const length = new DataView(arrayBuffer, position, 4).getInt32(0)
            position += 4
            const buffer = arrayBuffer.slice(position, position + length)
            position += length
            return Peaks.Stages.fromStream(new ByteArrayInput(buffer))
        }, n)
    }

    export class Stages {
        constructor(readonly stages: Stage[], readonly channels: Int32Array[], readonly numFrames: int) {}

        static fromStream(input: DataInput): Stages {
            const numFrames = input.readInt()
            const numStages = input.readByte()
            const stages = Arrays.create(() => Stage.fromStream(input), numStages)
            const numChannels = input.readByte()
            const channels: Array<Int32Array> = Arrays.create(() => {
                const length = input.readInt()
                const channel = new Int32Array(length)
                for (let i = 0; i < length; i++) {channel[i] = input.readInt()}
                return channel
            }, numChannels)
            return new Peaks.Stages(stages, channels, numFrames)
        }

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
    }

    export class Stage {
        static fromStream(input: DataInput): Stage {
            const mask = input.readInt()
            const shift = input.readInt()
            const numPeaks = input.readInt()
            const dataOffset = input.readInt()
            return new Stage(mask, shift, numPeaks, dataOffset)
        }

        // noinspection JSUnusedGlobalSymbols
        constructor(readonly mask: int, readonly shift: int, readonly numPeaks: int, readonly dataOffset: int) {}

        unitsEachPeak(): int {return 1 << this.shift}
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