import { Peaks } from "./common/peaks.ts"
import { panic } from "./common/lang.ts"

const sampleRate = 44100 // the sample-rate at which the peaks were computed

const Colors: Record<string, string> = {
    "Electro": "hsl(190, 60%, 40%)",
    "Techno": "hsl(0, 0%, 45%)",
    "House": "hsl(45, 66%, 45%)",
    "Drum & Bass": "hsl(0, 50%, 50%)",
    "Reggae": "hsl(100, 60%, 45%)",
    "Downtempo": "hsl(210, 30%, 70%)",
    "Ambient": "hsl(197, 71%, 65%)",
    "Future Bass": "hsl(300, 40%, 50%)",
    "Experimental": "hsl(260, 50%, 50%)",
    "Synthwave": "hsl(275, 60%, 70%)"
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
    rating?: 0 | 1 | 2 | 3
}

export class Track implements Readonly<TrackJSON> {
    readonly id: string
    readonly name: string
    readonly bpm: number
    readonly date: number
    readonly genre: string
    readonly rating: 0 | 1 | 2 | 3

    constructor({ id, name, bpm, date, genre, rating }: TrackJSON, readonly stages: Peaks.Stages) {
        this.id = id
        this.name = name
        this.bpm = bpm
        this.date = date
        this.genre = genre in Colors ? genre : panic("Unknown genre")
        this.rating = rating ?? 0
    }

    get color(): string {return Colors[this.genre]}
    get mp3URL(): string {return `mp3/${this.id}.mp3`}
    get coverURL(): string {return `cover/${this.id}.webp`}
    get tinyCoverURL(): string {return `cover/${this.id}.tiny.webp`}
    get seconds(): number {return this.stages.numFrames / sampleRate}
    get dateString(): string {return formatDate(new Date(this.date))}
    get durationString(): string {
        const s = Math.floor(this.seconds) % 60
        const m = Math.floor(this.seconds / 60) % 60
        const h = Math.floor(this.seconds / 3600)
        return (h > 0 ? [h, m, s] : [m, s]).map(x => x.toString(10).padStart(2, "0")).join(":")
    }
}