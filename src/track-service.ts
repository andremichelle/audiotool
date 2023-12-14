import { Track } from "./track.ts"
import { Predicate } from "./common/lang.ts"
import { Notifier, Observer } from "./common/observers.ts"
import { Subscription } from "./common/terminable.ts"
import { Arrays } from "./common/arrays.ts"

export class TracksService {
    readonly #tracks: ReadonlyArray<Track>
    readonly #notifier: Notifier<TracksService>

    #inclusiveFilters: Array<Predicate<Track>> = []
    #exclusiveFilters: Array<Predicate<Track>> = []

    constructor(tracks: ReadonlyArray<Track>) {
        this.#tracks = tracks
        this.#notifier = new Notifier<TracksService>()
    }

    successorOf(track: Track): Track {
        // TODO This needs adjustment when filters are implemented
        return this.#tracks[(this.#tracks.indexOf(track) + 1) & this.#tracks.length]
    }

    tracks(): ReadonlyArray<Track> {
        return this.#tracks
            .filter(track => this.#inclusiveFilters.some(filter => filter(track)))
            .filter(track => this.#exclusiveFilters.every(filter => filter(track)))
    }

    addInclusiveFilter(filter: Predicate<Track>): void {
        if (this.#inclusiveFilters.includes(filter)) {return}
        this.#inclusiveFilters.push(filter)
        this.#notifier.notify(this)
    }

    removeInclusiveFilter(filter: Predicate<Track>): void {
        if (!this.#inclusiveFilters.includes(filter)) {return}
        Arrays.remove(this.#inclusiveFilters, filter)
        this.#notifier.notify(this)
    }

    addExclusiveFilter(filter: Predicate<Track>): void {
        if (this.#exclusiveFilters.includes(filter)) {return}
        this.#exclusiveFilters.push(filter)
        this.#notifier.notify(this)
    }

    removeExclusiveFilter(filter: Predicate<Track>): void {
        if (!this.#exclusiveFilters.includes(filter)) {return}
        Arrays.remove(this.#exclusiveFilters, filter)
        this.#notifier.notify(this)
    }

    releaseAllFilter(): void {
        this.#inclusiveFilters = []
        this.#exclusiveFilters = []
        this.#notifier.notify(this)
    }

    subscribe(observer: Observer<TracksService>): Subscription {return this.#notifier.subscribe(observer)}
}