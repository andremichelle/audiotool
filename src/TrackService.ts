import { panic, Predicate } from "./common/lang.ts"
import { Notifier, Observer } from "./common/observers.ts"
import { Subscription } from "./common/terminable.ts"
import { Arrays } from "./common/arrays.ts"
import { Option } from "./common/option.ts"
import { Track } from "./Track.ts"

export class TracksService {
    static readonly AtLeastOneStar = (track: Track) => track.rating > 0

    readonly #tracks: ReadonlyArray<Track>
    readonly #notifier: Notifier<TracksService>

    #inclusiveFilters: Array<Predicate<Track>> = []
    #exclusiveFilters: Array<Predicate<Track>> = []

    readonly #combinedFilter: Predicate<Track> = (track: Track) =>
        this.#inclusiveFilters.some(filter => filter(track))
        && this.#exclusiveFilters.every(filter => filter(track))

    constructor(tracks: ReadonlyArray<Track>) {
        this.#tracks = tracks
        this.#notifier = new Notifier<TracksService>()
    }

    successorOf(track: Track): Option<Track> {
        const tracks = this.#tracks
        const index = tracks.indexOf(track)
        if (-1 === index) {return panic(`${track} is not part of track-list`)}
        for (let i = 1; i <= tracks.length; i++) {
            const maybeSuccessor = tracks[(index + i) % tracks.length]
            if (this.#combinedFilter(maybeSuccessor)) {
                return Option.wrap(maybeSuccessor)
            }
        }
        return Option.None
    }

    tracks(): ReadonlyArray<Track> {return this.#tracks.filter(track => this.#combinedFilter(track))}

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

    subscribe(observer: Observer<TracksService>): Subscription {return this.#notifier.subscribe(observer)}
}