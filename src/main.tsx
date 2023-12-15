import React from "react"
import ReactDOM from "react-dom/client"
import { App } from "./components/App.tsx"
import data from "./data.json"
import { Peaks } from "./common/peaks.ts"
import { int } from "./common/lang.ts"
import { PlaybackService } from "./PlaybackService.ts"
import { MeterWorkletNode } from "./waa/meter-node.ts"
import { TracksService } from "./TrackService.ts"
import { Track, TrackJSON } from "./Track.ts"
import { Genres } from "./genres.ts"

(async () => {
    console.debug("booting...")

    const context = new AudioContext({ latencyHint: "playback" })
    await MeterWorkletNode.load(context)
    if (context.state === "suspended") {
        window.addEventListener("click", () => {
            context.resume()
                .then(() => {}, reason => `AudioContext resume failed with '${reason}'`)
        }, { once: true, capture: true })
    }
    const stages = await Peaks.load("peaks.bin", 196)
    const tracksService: TracksService = new TracksService((data as ReadonlyArray<TrackJSON>)
        .map((data: TrackJSON, index: int) => new Track(data, stages[index])))
    const playback = new PlaybackService(context, tracksService)

    // default filters
    Object.values(Genres).forEach(genre => tracksService.addInclusiveFilter(genre.filter))
    tracksService.addExclusiveFilter(TracksService.AtLeastOneStar)

    // play track from url hash (if any)
    const hash = location.hash
    const idAsNumber = parseInt(hash.substring(1, hash.indexOf("/")))
    if (!isNaN(idAsNumber) && idAsNumber > 0 && idAsNumber <= 196) {
        tracksService.getUnfilteredByIndex(idAsNumber - 1).ifSome(track => {
            if (!tracksService.isTrackVisible(track)) {
                Object.values(Genres).forEach(genre => tracksService.addInclusiveFilter(genre.filter))
                tracksService.removeExclusiveFilter(TracksService.AtLeastOneStar)
            }
            playback.toggle(track)
        })
    }

    ReactDOM.createRoot(document.getElementById("root")!)
        .render(
            <React.StrictMode>
                <App tracksService={tracksService} playback={playback} />
            </React.StrictMode>)
})()