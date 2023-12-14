import React from "react"
import ReactDOM from "react-dom/client"
import { App } from "./components/App.tsx"
import data from "./data.json"
import { Track, TrackJSON } from "./track.ts"
import { Peaks } from "./common/peaks.ts"
import { int } from "./common/lang.ts"
import { Playback } from "./Playback.ts"
import { MeterWorkletNode } from "./waa/meter-node.ts"

// TODO
//  Ellipses for names
//  Icon does not animate on Safari
//  Keyboard Shortcuts
//  Track download
//  Track rating
//  Main Player with visuals
//  Filter Genre/rating
//  Sorting Name, Date
//  Backend?

(async () => {
    console.debug("booting...")
    const context = new AudioContext({ latencyHint: "playback" })
    context.addEventListener("statechange", () => {
        console.debug(`AudioContext.state changed to ${context.state}`)
    })
    console.debug([
        `AudioContext.sample-rate: ${context.sampleRate}Hz`,
        `AudioContext.baseLatency: ${context.baseLatency ?? "N/A"}sec`,
        `AudioContext.outputLatency: ${context.outputLatency ?? "N/A"}sec`
    ].join(", "))
    try {
        await MeterWorkletNode.load(context)
    } catch (reason) {
        console.error(`Loading ${MeterWorkletNode.name} failed with`, reason)
        return
    }
    const stages = await Peaks.load("peaks.bin", 196)
    const tracks: ReadonlyArray<Track> = (data as ReadonlyArray<TrackJSON>)
        .map((data: TrackJSON, index: int) => new Track(data, stages[index]))
    const playback = new Playback(context, tracks)

    const genres = new Set()
    for (const track of tracks) {
        genres.add(track.genre)
    }
    ReactDOM.createRoot(document.getElementById("root")!)
        .render(
            <React.StrictMode>
                <App tracks={tracks} playback={playback} />
            </React.StrictMode>)
})()