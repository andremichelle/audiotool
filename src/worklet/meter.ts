import { Arrays } from "../common/arrays"
import { UpdateMeterMessage } from "../waa/meter-message"

class RMS {
    readonly values: Float32Array
    readonly inv: number
    sum: number
    index: number

    constructor(readonly n: number) {
        this.values = new Float32Array(n)
        this.inv = 1.0 / n
        this.sum = 0.0
        this.index = 0 | 0
    }

    pushPop(squared: number): number {
        this.sum -= this.values[this.index]
        this.sum += squared
        this.values[this.index] = squared
        if (++this.index === this.n) this.index = 0
        return 0.0 >= this.sum ? 0.0 : Math.sqrt(this.sum * this.inv)
    }
}

const RENDER_QUANTUM: number = 128 | 0

registerProcessor("meter", class extends AudioWorkletProcessor {
    readonly numberOfLines: number
    readonly channelCount: number

    readonly maxPeaks: Float32Array[]
    readonly maxSquares: Float32Array[]
    readonly updateRate: number
    readonly rmsChannels: RMS[][]

    updateCount: number = 0 | 0

    constructor(options: any) {
        super()

        this.numberOfLines = options.numberOfInputs
        this.channelCount = options.channelCount
        console.assert(options.numberOfOutputs === this.numberOfLines)

        this.maxPeaks = Arrays.create(() => new Float32Array(this.channelCount), this.numberOfLines)
        this.maxSquares = Arrays.create(() => new Float32Array(this.channelCount), this.numberOfLines)

        const rmsSize: number = sampleRate * 0.050 // 50ms
        const fps: number = 60.0
        this.updateRate = (sampleRate / fps) | 0
        this.rmsChannels = Arrays.create(() => Arrays.create(() => new RMS(rmsSize), this.channelCount), this.numberOfLines)
    }

    // noinspection JSUnusedGlobalSymbols
    process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
        for (let lineIndex = 0; lineIndex < this.numberOfLines; lineIndex++) {
            const input: Float32Array[] = inputs[lineIndex]
            const output: Float32Array[] = outputs[lineIndex]
            const rcl = this.rmsChannels[lineIndex]
            const mpl = this.maxPeaks[lineIndex]
            const msl = this.maxSquares[lineIndex]
            for (let channel: number = 0; channel < this.channelCount; ++channel) {
                const inputChannel: Float32Array = input[channel]
                const outputChannel: Float32Array = output[channel]
                const rms: RMS = rcl[channel]
                if (undefined === inputChannel) {
                    mpl[channel] = 0.0
                    msl[channel] = 0.0
                } else {
                    let maxPeak: number = mpl[channel]
                    let maxSquare: number = msl[channel]
                    for (let i: number = 0; i < RENDER_QUANTUM; ++i) {
                        const inp: number = outputChannel[i] = inputChannel[i] // we pass the signal
                        maxPeak = Math.max(maxPeak, Math.abs(inp))
                        maxSquare = Math.max(maxSquare, rms.pushPop(inp * inp))
                    }
                    mpl[channel] = maxPeak
                    msl[channel] = maxSquare
                }
            }
        }
        this.updateCount += RENDER_QUANTUM
        if (this.updateCount >= this.updateRate) {
            this.updateCount -= this.updateRate
            const message: UpdateMeterMessage = {
                type: "update-meter",
                maxSquares: this.maxSquares,
                maxPeaks: this.maxPeaks
            }
            this.port.postMessage(message)
            for (let lineIndex = 0; lineIndex < this.numberOfLines; lineIndex++) {
                const mpl = this.maxPeaks[lineIndex]
                const msl = this.maxSquares[lineIndex]
                for (let channelIndex: number = 0; channelIndex < this.channelCount; ++channelIndex) {
                    mpl[channelIndex] *= 0.93
                    msl[channelIndex] *= 0.93
                }
            }
        }
        return true
    }
})