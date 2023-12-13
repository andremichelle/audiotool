import { Peaks } from "./common/peaks.ts"
import { panic } from "./common/lang.ts"
import { Random } from "./common/random.ts"

const Genres = [
    "Electro", "Techno",
    "House", "Drum & Bass",
    "Reggae", "Downtempo",
    "Ambient", "Future Bass",
    "Experimental", "Synthwave"
]

const random = new Random(0x123123)
const Colors: Record<string, string> = {}
Genres.map(genre => {
    const h = random.nextInt(0, 360)
    const s = random.nextInt(50, 70)
    const l = random.nextInt(50, 70)
    Colors[genre] = `hsl(${h}, ${s}%, ${l}%)`
})

export interface TrackData {
    id: string
    name: string
    bpm: number
    date: number
    genre: string
}

export class Track implements Readonly<TrackData> {
    readonly id: string
    readonly name: string
    readonly bpm: number
    readonly date: number
    readonly genre: string

    constructor({ id, name, bpm, date, genre }: TrackData, readonly stages: Peaks.Stages) {
        this.id = id
        this.name = name
        this.bpm = bpm
        this.date = date
        this.genre = Genres.includes(genre) ? genre : panic("Unknown genre")
    }

    get color(): string {return Colors[this.genre]}
    get mp3URL(): string {return `mp3/${this.id}.mp3`}
    get coverURL(): string {return `cover/${this.id}.jpg`}
}