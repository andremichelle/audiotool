import { float, FloatArray, int, Procedure, Unhandled } from "./lang"
import { Option } from "./option"
import { Arrays } from "./arrays"
import { Messenger } from "./messenger"
import { Communicator } from "./communicator"
import { Float16 } from "./floats"
import { src } from "../src-path"
import { ByteArrayOutputStream, DataInput, DataOutput } from "./data.ts"

export namespace Peaks {
    export const maxShift = (numFrames: int, width: int = 1600): Option<int> => {
        const ratio = numFrames / width
        if (ratio <= 1.0) {
            return Option.None
        }
        return Option.wrap(Math.floor(Math.log(ratio) / Math.log(2.0)))
    }

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

    export interface PeakWorkerProtocol {
        generateAsync(progress: Procedure<number>,
                      shifts: Uint8Array,
                      frames: FloatArray[],
                      numFrames: int,
                      numChannels: int): Promise<Stages>
    }

    export class Stages {
        static getOrCreateWorker(): PeakWorkerProtocol {
            return Communicator.createProtocolCaller<PeakWorkerProtocol>(
                Messenger.for(new Worker(new URL("worker/peaks.ts", src), { type: "module" })).channel("peaks"),
                router => new class implements PeakWorkerProtocol {
                    async generateAsync(
                        progress: Procedure<number>,
                        shifts: Uint8Array,
                        frames: FloatArray[],
                        numFrames: int,
                        numChannels: int): Promise<Stages> {
                        return Stages.fixPrototypes(await router.dispatchAndReturn(
                            this.generateAsync, progress, shifts, frames, numFrames, numChannels) as Stages)
                    }
                })
        }

        // This looks a bit strange, but the prototype is lost after serialization
        static fixPrototypes(o: Stages): Stages {
            Object.setPrototypeOf(o, Stages.prototype)
            o.stages.forEach(x => Object.setPrototypeOf(x, Stage.prototype))
            return o as Stages
        }

        static readonly None = new Stages([], [], 0)

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

        toByteArray(): ArrayBuffer {
            const output = new ByteArrayOutputStream(4096)
            output.writeInt(this.numFrames)
            output.writeByte(this.stages.length)
            for (let si = 0; si < this.stages.length; si++) {
                const stage = this.stages[si]
                stage.write(output)
            }
            output.writeByte(this.channels.length)
            for (let ci = 0; ci < this.channels.length; ci++) {
                const array = this.channels[ci]
                output.writeInt(array.length)
                for (let i = 0; i < array.length; i++) {
                    output.writeInt(array[i])
                }
            }
            return output.toArrayBuffer()
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

        minRatio(): number {
            return this.stages.length === 0 ? Number.POSITIVE_INFINITY : 1 << this.stages[0].shift
        }

        toString(): string {
            return `{Memory numStages: ${this.stages.length}}`
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

        constructor(readonly mask: int, readonly shift: int, readonly numPeaks: int, readonly dataOffset: int) {}

        unitsEachPeak(): int {return 1 << this.shift}

        write(output: DataOutput): void {
            output.writeInt(this.mask)
            output.writeInt(this.shift)
            output.writeInt(this.numPeaks)
            output.writeInt(this.dataOffset)
        }
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

    export const generate = (
        progress: Procedure<number>,
        shifts: Uint8Array,
        frames: FloatArray[],
        numFrames: int,
        numChannels: int): Stages => {
        if (frames.length !== numChannels) {
            console.warn(`Invalid numberOfChannels. Expected: ${numChannels}. Got ${frames.length}`)
        }

        class State {
            min: number = Number.POSITIVE_INFINITY
            max: number = Number.NEGATIVE_INFINITY
            index: int = 0
        }

        const numShifts = shifts.length
        const [stages, dataOffset] = initStages(shifts, numFrames)
        const data: Int32Array[] = Arrays.create(() => new Int32Array(dataOffset), numChannels)
        const minMask = stages[0].mask
        const total = numChannels * numFrames
        let count = 0
        for (let channel = 0; channel < numChannels; ++channel) {
            const channelData = data[channel]
            const channelFrames = frames[channel]
            const states: State[] = Arrays.create(() => new State(), numShifts)
            let min = Number.POSITIVE_INFINITY
            let max = Number.NEGATIVE_INFINITY
            let position = 0
            for (let i = 0; i < numFrames; ++i) {
                const frame = channelFrames[i]
                min = Math.min(frame, min)
                max = Math.max(frame, max)
                if ((++position & minMask) === 0) {
                    for (let j = 0; j < numShifts; ++j) {
                        const stage = stages[j]
                        const state = states[j]
                        state.min = Math.min(state.min, min)
                        state.max = Math.max(state.max, max)
                        if (0 === (stage.mask & position)) {
                            channelData[stage.dataOffset + state.index++] = pack(state.min, state.max)
                            state.min = Number.POSITIVE_INFINITY
                            state.max = Number.NEGATIVE_INFINITY
                        }
                    }
                    min = Number.POSITIVE_INFINITY
                    max = Number.NEGATIVE_INFINITY
                }
                if (0 === (++count & 262143)) {
                    progress(count / total)
                }
            }
        }
        progress(1.0)
        return new Stages(stages, data, numFrames)
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
