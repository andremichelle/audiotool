import { Track } from "./track.ts"
import { Option } from "./common/option.ts"
import { Subscription } from "./common/terminable.ts"
import { Notifier } from "./common/observers.ts"
import { Procedure, unitValue } from "./common/lang.ts"
import { MeterWorkletNode } from "./waa/meter-node.ts"

export type PlaybackEvent = {
    state: "activate"
    track: Option<Track>
} | {
    state: "buffering"
} | {
    state: "playing"
    progress: unitValue
} | {
    state: "paused"
} | {
    state: "error"
    reason: string
}

export type PlaybackState = PlaybackEvent["state"]

export class Playback {
    readonly #context: AudioContext
    readonly #tracks: ReadonlyArray<Track>

    readonly #audio = new Audio()
    readonly #meter: MeterWorkletNode
    readonly #sourceNode: MediaElementAudioSourceNode
    readonly #notifier = new Notifier<PlaybackEvent>

    #active: Option<Track> = Option.None

    constructor(context: AudioContext, tracks: ReadonlyArray<Track>) {
        this.#context = context
        this.#tracks = tracks

        this.#sourceNode = this.#context.createMediaElementSource(this.#audio)
        this.#meter = new MeterWorkletNode(this.#context, 1, 2)

        this.#sourceNode.connect(this.#meter)
        this.#meter.connect(this.#context.destination)

        console.debug("MediaElementAudioSourceNode:")
        console.debug(`channelCount: ${this.#sourceNode.channelCount}`)
        console.debug(`channelInterpretation: ${this.#sourceNode.channelInterpretation}`)
        console.debug(`channelCountMode: ${this.#sourceNode.channelCountMode}`)
        console.debug(`numberOfInputs: ${this.#sourceNode.numberOfInputs}`)
        console.debug(`numberOfOutputs: ${this.#sourceNode.numberOfOutputs}`)

        console.debug("MeterWorkletNode:")
        console.debug(`channelCount: ${this.#meter.channelCount}`)
        console.debug(`channelInterpretation: ${this.#meter.channelInterpretation}`)
        console.debug(`channelCountMode: ${this.#meter.channelCountMode}`)
        console.debug(`numberOfInputs: ${this.#meter.numberOfInputs}`)
        console.debug(`numberOfOutputs: ${this.#meter.numberOfOutputs}`)

        console.debug("Destination:")
        console.debug(`channelCount: ${this.#context.destination.channelCount}`)
        console.debug(`channelInterpretation: ${this.#context.destination.channelInterpretation}`)
        console.debug(`channelCountMode: ${this.#context.destination.channelCountMode}`)
        console.debug(`numberOfInputs: ${this.#context.destination.numberOfInputs}`)
        console.debug(`numberOfOutputs: ${this.#context.destination.numberOfOutputs}`)

        if (this.#context.state !== "running") {
            window.addEventListener("pointerdown", () => {
                console.debug("AudioContext.resume()")
                this.#context.resume()
                    .then(() => console.debug("AudioContext resumed"))
                    .catch(reason => `AudioContext resume failed with '${reason}'`)
            }, { once: true })
        }
    }

    toggle(track: Track): void {
        if (this.#active.contains(track)) {
            if (this.#audio.paused) {
                this.#audio.play().catch(reason => console.debug(`Could not play audio due to '${reason}'`))
            } else {
                this.#audio.pause()
            }
            return
        }
        this.eject()
        this.active = Option.wrap(track)
        this.#notify({ state: "buffering" })
        this.#play(track)
    }

    playTrackFrom(track: Track, position: unitValue): void {
        if (this.#active.contains(track)) {
            this.#audio.currentTime = track.seconds * position
            if (this.#audio.paused) {
                this.#audio.play().catch()
            }
            return
        }
        this.eject()
        this.active = Option.wrap(track)
        this.#notify({ state: "buffering" })
        this.#play(track)
        this.#audio.currentTime = track.seconds * position
    }

    eject(): void {
        this.active = Option.None
        this.#audio.onended = null
        this.#audio.onplay = null
        this.#audio.onpause = null
        this.#audio.onerror = null
        this.#audio.onstalled = null
        this.#audio.ontimeupdate = null
    }

    subscribe(observer: Procedure<PlaybackEvent>): Subscription {return this.#notifier.subscribe(observer)}

    get active(): Option<Track> {return this.#active}
    set active(value: Option<Track>) {
        this.#active = value
        this.#notify({ state: "activate", track: value })
    }
    get meter(): MeterWorkletNode {return this.#meter}

    #play(track: Track): void {
        this.#audio.onended = () =>
            this.#active.map(active => (this.#tracks.findIndex(track => track === active) + 1) % this.#tracks.length)
                .ifSome(index => this.toggle(this.#tracks[index]))
        this.#audio.onplay = () => this.#notify({ state: "buffering" })
        this.#audio.onpause = () => this.#notify({ state: "paused" })
        this.#audio.onerror = (event, _source, _lineno, _colno, error) => this.#notify({
            state: "error",
            reason: error?.message ?? event instanceof Event ? "Unknown" : event
        })
        this.#audio.onstalled = () => this.#notify({ state: "buffering" })
        this.#audio.ontimeupdate = () => this.#notify({
            state: "playing",
            progress: this.#audio.currentTime / track.seconds
        })
        this.#audio.src = track.mp3URL
        this.#audio.play().catch()
    }

    #notify(event: PlaybackEvent) {this.#notifier.notify(event)}
}