import { Option } from "./common/option.ts"
import { Subscription } from "./common/terminable.ts"
import { Notifier } from "./common/observers.ts"
import { Procedure, unitValue } from "./common/lang.ts"
import { MeterWorkletNode } from "./waa/meter-node.ts"
import { Track } from "./Track.ts"
import { TracksService } from "./TrackService.ts"

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

export class PlaybackService {
    readonly #context: AudioContext
    readonly #tracksService: TracksService

    readonly #audio: HTMLAudioElement
    readonly #meter: MeterWorkletNode
    readonly #sourceNode: MediaElementAudioSourceNode
    readonly #notifier = new Notifier<PlaybackEvent>

    #active: Option<Track> = Option.None

    constructor(context: AudioContext, tracksService: TracksService) {
        this.#context = context
        this.#tracksService = tracksService

        this.#audio = new Audio()
        this.#sourceNode = this.#context.createMediaElementSource(this.#audio)
        this.#meter = new MeterWorkletNode(this.#context, 1, 2)

        this.#sourceNode.connect(this.#meter)
        this.#meter.connect(this.#context.destination)
    }

    toggle(track: Track): void {
        if (this.#active.contains(track)) {
            if (this.#audio.paused) {
                this.#audio.play().catch(() => {})
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
    set active(track: Option<Track>) {
        this.#active = track
        this.#updateBrowserUrl(track)
        this.#notify({ state: "activate", track })
    }
    get meter(): MeterWorkletNode {return this.#meter}

    #play(track: Track): void {
        this.#audio.onended = () => this.#tracksService.successorOf(track).match({
            none: () => this.eject(),
            some: track => this.toggle(track)
        })
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
        this.#audio.play().catch(() => {})
    }

    #notify(event: PlaybackEvent) {this.#notifier.notify(event)}

    #updateBrowserUrl(track: Option<Track>): void {
        window.history.replaceState(null, "", track.match({
            none: () => "",
            some: track => {
                const name = track.name.replaceAll("#", "-")
                const parts = name.split(" ").map(part => `${part.at(0)!.toUpperCase()}${part.substring(1)}`)
                return `#${track.id}/${parts.join("")}`
            }
        }))
    }
}