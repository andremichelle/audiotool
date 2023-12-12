import { Track } from "./track.ts"
import { Option } from "./common/option.ts"
import { PlaybackState } from "./PlaybackState.ts"

export class Playback {
    readonly #audio = new Audio()

    #active: Option<Track> = Option.None
    #state: PlaybackState = PlaybackState.Paused

    // TODO Make observable
    // TODO Merge PlaybackState & PlaybackProgress into union

    constructor() {}

    play(track: Track): void {
        this.#active = Option.wrap(track)
        this.#audio.src = track.mp3URL
        this.#audio.play().catch()
    }
}