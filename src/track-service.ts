import { Track } from "./track.ts"
import { Predicate } from "./common/lang.ts"
import { Notifier, Observer } from "./common/observers.ts"
import { Subscription } from "./common/terminable.ts"

export class TracksService {
    readonly #tracks: ReadonlyArray<Track>
    readonly #notifier: Notifier<TracksService>

    #filters: Array<Predicate<Track>> = []

    constructor(tracks: ReadonlyArray<Track>) {
        this.#tracks = tracks
        this.#notifier = new Notifier<TracksService>()
    }

    successorOf(track: Track): Track {
        // TODO This needs adjustment when filters are implemented
        return this.#tracks[(this.#tracks.indexOf(track) + 1) & this.#tracks.length]
    }

    tracks(): ReadonlyArray<Track> {return this.#tracks.filter(track => this.#filters.every(filter => filter(track)))}

    applyFilter(filter: Predicate<Track>): void {
        if (this.#filters.includes(filter)) {return}
        this.#filters.push(filter)
        this.#notifier.notify(this)
    }

    releaseAllFilter(): void {
        this.#filters = []
        this.#notifier.notify(this)
    }

    subscribe(observer: Observer<TracksService>): Subscription {return this.#notifier.subscribe(observer)}
}