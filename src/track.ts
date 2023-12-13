import { Peaks } from "./common/peaks.ts"
import { panic } from "./common/lang.ts"

const sampleRate = 44100 // the sample-rate at which the peaks were computed

const Genres = [
    "Electro", "Techno",
    "House", "Drum & Bass",
    "Reggae", "Downtempo",
    "Ambient", "Future Bass",
    "Experimental", "Synthwave"
]

const Colors: Record<string, string> = {
    "Electro": "hsl(200, 60%, 40%)",
    "Techno": "hsl(0, 0%, 40%)",
    "House": "hsl(45, 60%, 45%)",
    "Drum & Bass": "hsl(0, 50%, 50%)",
    "Reggae": "hsl(100, 60%, 45%)",
    "Downtempo": "hsl(210, 30%, 60%)",
    "Ambient": "hsl(197, 71%, 73%)",
    "Future Bass": "hsl(300, 40%, 50%)",
    "Experimental": "hsl(260, 50%, 50%)",
    "Synthwave": "hsl(285, 80%, 50%)"
}

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const formatDate = (date: Date): string => {
    const day = date.getDate()
    const daySuffix: string = (() => {
        switch (day) {
            case 1:
            case 21:
            case 31:
                return "st"
            case 2:
            case 22:
                return "nd"
            case 3:
            case 23:
                return "rd"
            default:
                return "th"
        }
    })()
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    return `${month}, ${day}${daySuffix} ${year}`
}

export interface TrackJSON {
    id: string
    name: string
    bpm: number
    date: number
    genre: string
}

export class Track implements Readonly<TrackJSON> {
    readonly id: string
    readonly name: string
    readonly bpm: number
    readonly date: number
    readonly genre: string

    constructor({ id, name, bpm, date, genre }: TrackJSON, readonly stages: Peaks.Stages) {
        this.id = id
        this.name = name
        this.bpm = bpm
        this.date = date
        this.genre = Genres.includes(genre) ? genre : panic("Unknown genre")
    }

    get color(): string {return Colors[this.genre]}
    get mp3URL(): string {return `mp3/${this.id}.mp3`}
    get coverURL(): string {return `cover/${this.id}.jpg`}
    get seconds(): number {return this.stages.numFrames / sampleRate}
    get dateString(): string {return formatDate(new Date(this.date))}
    get durationString(): string {
        const s = Math.floor(this.seconds) % 60
        const m = Math.floor(this.seconds / 60) % 60
        const h = Math.floor(this.seconds / 3600)
        return (h > 0 ? [h, m, s] : [m, s]).map(x => x.toString(10).padStart(2, "0")).join(":")
    }
}