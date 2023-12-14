import { Arrays } from "../common/arrays"
import { UpdateMeterMessage } from "./meter-message"
import { Notifier } from "../common/observers.ts"
import { Procedure } from "../common/lang.ts"
import { Subscription } from "../common/terminable.ts"
import WorkletUrl from "../worklet/meter.ts?worker&url"

export type MeterValues = {
    readonly peaks: Float32Array[]
    readonly squares: Float32Array[]
    readonly peakHoldValue: Float32Array[]
}

export class MeterWorkletNode extends AudioWorkletNode {
    static load(context: BaseAudioContext): Promise<void> {
        console.debug(`Load ${MeterWorkletNode.name} from ${WorkletUrl}`)
        return context.audioWorklet.addModule(WorkletUrl)
    }

    static readonly PEAK_HOLD_DURATION: number = 1000.0
    static readonly CLIP_HOLD_DURATION: number = 2000.0

    readonly peaks: Float32Array[]
    readonly squares: Float32Array[]
    readonly peakHoldValue: Float32Array[]
    readonly releasePeakHoldTime: Float32Array[]

    readonly #notifier = new Notifier<MeterValues>()

    constructor(context: BaseAudioContext,
                readonly numLines: number,
                readonly channelCount: number) {
        super(context, "meter", {
            numberOfInputs: numLines,
            numberOfOutputs: numLines,
            outputChannelCount: new Array(numLines).fill(channelCount),
            channelCount: channelCount,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        })

        this.peaks = Arrays.create(() => new Float32Array(channelCount), numLines)
        this.squares = Arrays.create(() => new Float32Array(channelCount), numLines)
        this.peakHoldValue = Arrays.create(() => new Float32Array(channelCount), numLines)
        this.releasePeakHoldTime = Arrays.create(() => new Float32Array(channelCount), numLines)

        this.port.onmessage = event => {
            const now = performance.now()
            const message: UpdateMeterMessage = event.data as UpdateMeterMessage
            for (let lineIndex = 0; lineIndex < numLines; lineIndex++) {
                this.peaks[lineIndex] = message.maxPeaks[lineIndex]
                this.squares[lineIndex] = message.maxSquares[lineIndex]
                for (let channelIndex = 0; channelIndex < channelCount; ++channelIndex) {
                    const maxPeak = this.peaks[lineIndex][channelIndex]
                    if (this.peakHoldValue[lineIndex][channelIndex] <= maxPeak) {
                        this.peakHoldValue[lineIndex][channelIndex] = maxPeak
                        this.releasePeakHoldTime[lineIndex][channelIndex] = now + (1.0 < maxPeak
                            ? MeterWorkletNode.CLIP_HOLD_DURATION
                            : MeterWorkletNode.PEAK_HOLD_DURATION)
                    } else if (this.releasePeakHoldTime[lineIndex][channelIndex] < now) {
                        this.peakHoldValue[lineIndex][channelIndex] = 0.0
                    }
                }
            }
            this.#notifier.notify(this)
        }
    }

    subscribe(observer: Procedure<MeterValues>): Subscription {return this.#notifier.subscribe(observer)}
}