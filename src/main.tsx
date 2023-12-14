import React from "react"
import ReactDOM from "react-dom/client"
import { App } from "./components/App.tsx"
import data from "./data.json"
import { Track, TrackJSON } from "./track.ts"
import { Peaks } from "./common/peaks.ts"
import { int } from "./common/lang.ts"
import { Playback } from "./Playback.ts"
import { MeterWorkletNode } from "./waa/meter-node.ts"
import { TracksService } from "./track-service.ts"

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
    if (context.state === "suspended") {
        window.addEventListener("click", () => {
            context.resume()
                .then(
                    () => console.debug("AudioContext resumed"),
                    reason => `AudioContext resume failed with '${reason}'`)
        }, { once: true, capture: true })
    }
    console.debug([
        `AudioContext.sample-rate: ${context.sampleRate}Hz`,
        `AudioContext.baseLatency: ${context.baseLatency?.toFixed(3) ?? "N/A"}sec`
    ].join(", "))
    try {
        await MeterWorkletNode.load(context)
    } catch (reason) {
        console.error(`Loading ${MeterWorkletNode.name} failed with`, reason)
        return
    }
    const stages = await Peaks.load("peaks.bin", 196)
    const trackService: TracksService = new TracksService((data as ReadonlyArray<TrackJSON>)
        .map((data: TrackJSON, index: int) => new Track(data, stages[index])))
    const playback = new Playback(context, trackService)

    ReactDOM.createRoot(document.getElementById("root")!)
        .render(
            <React.StrictMode>
                <App trackService={trackService} playback={playback} />
            </React.StrictMode>)
})()