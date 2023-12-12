export interface TrackData {
    id: string
    name: string
    bpm: number
    date: number
    genre: string
}

export class TrackModel implements Readonly<TrackData> {
    readonly id: string
    readonly name: string
    readonly bpm: number
    readonly date: number
    readonly genre: string

    constructor({ id, name, bpm, date, genre }: TrackData) {
        this.id = id
        this.name = name
        this.bpm = bpm
        this.date = date
        this.genre = genre
    }

    get mp3URL(): string {return `mp3/${this.id}.mp3`}
    get coverURL(): string {return `cover/${this.id}.jpg`}
}