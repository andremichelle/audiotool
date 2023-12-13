import { Track } from "./track.ts"
import { Option } from "./common/option.ts"
import { Subscription } from "./common/terminable.ts"
import { Notifier } from "./common/observers.ts"
import { Procedure, unitValue } from "./common/lang.ts"

export type PlaybackEvent = {
    type: "activate"
    track: Option<Track>
} | {
    type: "buffering"
} | {
    type: "playing"
    progress: unitValue
} | {
    type: "paused"
} | {
    type: "error"
    reason: string
}

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
        this.#notify({ type: "buffering" })
        this.#playUrl(track.mp3URL)
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
        this.#notify({ type: "activate", track: value })
    }

    #playUrl(url: string): void {
        this.#audio.onended = () =>
            this.#active.map(active => (this.playlist.findIndex(track => track === active) + 1) % this.playlist.length)
                .ifSome(index => this.toggle(this.playlist[index]))
        this.#audio.onplay = () => this.#notify({ type: "buffering" })
        this.#audio.onpause = () => this.#notify({ type: "paused" })
        this.#audio.onerror = (event, _source, _lineno, _colno, error) => {
            const reason = error?.message ?? event instanceof Event ? "Unknown" : event
            console.log("onerror", reason)
            this.#notify({ type: "error", reason })
        }
        this.#audio.onstalled = () => this.#notify({ type: "buffering" })
        this.#audio.ontimeupdate = () => this.#notify({
            type: "playing",
            progress: this.#audio.currentTime / this.#audio.duration
        })
        this.#audio.src = url
        this.#audio.play().catch()
    }

    #notify(value: PlaybackEvent) {this.#notifier.notify(value)}
}