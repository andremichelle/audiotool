import { Track } from "./track.ts"
import { Option } from "./common/option.ts"
import { Subscription } from "./common/terminable.ts"
import { Notifier } from "./common/observers.ts"
import { Procedure, unitValue } from "./common/lang.ts"

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
    readonly #audio = new Audio()
    readonly #notifier = new Notifier<PlaybackEvent>

    #active: Option<Track> = Option.None

    constructor(readonly playlist: ReadonlyArray<Track>) {}

    toggle(track: Track): void {
        if (this.#active.contains(track)) {
            if (this.#audio.paused) {
                this.#audio.play().catch()
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

    #play(track: Track): void {
        this.#audio.onended = () =>
            this.#active.map(active => (this.playlist.findIndex(track => track === active) + 1) % this.playlist.length)
                .ifSome(index => this.toggle(this.playlist[index]))
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