import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.tsx"
import data from "./data.json"
import { Track, TrackData } from "./track.ts"
import { Peaks } from "./common/peaks.ts"
import { Arrays } from "./common/arrays.ts"
import { int } from "./common/lang.ts"
import { ByteArrayInput } from "./common/data.ts"
import { Playback } from "./Playback.ts"

(async () => {
    const playback = new Playback()
    const arrayBuffer = await fetch("peaks.bin").then(x => x.arrayBuffer())
    let position: int = 0 | 0
    const stages: Array<Peaks.Stages> = Arrays.create(() => {
        const length = new DataView(arrayBuffer, position, 4).getInt32(0)
        position += 4
        const buffer = arrayBuffer.slice(position, position + length)
        position += length
        return Peaks.Stages.fromStream(new ByteArrayInput(buffer))
    }, 196)
    const tracks: ReadonlyArray<Track> = (data as ReadonlyArray<TrackData>)
        .map((data: TrackData, index: int) => new Track(data, stages[index]))
    ReactDOM.createRoot(document.getElementById("root")!).render(
        <React.StrictMode>
            <App tracks={tracks} />
        </React.StrictMode>
    )
})()