import { Predicate } from "./common/lang.ts"
import { Track } from "./track.ts"

export type Genre = { name: string, color: string, filter: Predicate<Track> }

const init = (record: Record<string, Omit<Genre, "name" | "filter">>): Record<string, Genre> => {
    const result = {} as any
    for (const [, [name, initObject]] of Object.entries(record).entries()) {
        result[name] = { ...initObject, name, filter: (track: Track) => track.genre === name }
    }
    return result
}

export const Genres: Record<string, Genre> = init({
    "Electro": { color: "hsl(190, 60%, 40%)" },
    "Techno": { color: "hsl(0, 0%, 45%)" },
    "House": { color: "hsl(45, 55%, 45%)" },
    "Drum & Bass": { color: "hsl(0, 50%, 50%)" },
    "Reggae": { color: "hsl(100, 60%, 45%)" },
    "Downtempo": { color: "hsl(210, 30%, 70%)" },
    "Ambient": { color: "hsl(197, 71%, 65%)" },
    "Future Bass": { color: "hsl(300, 40%, 50%)" },
    "Experimental": { color: "hsl(260, 50%, 50%)" },
    "Synthwave": { color: "hsl(275, 60%, 70%)" }
})