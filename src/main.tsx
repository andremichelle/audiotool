import React from "react"
import ReactDOM from "react-dom/client"
import { App } from "./components/App.tsx"
import data from "./data.json"
import { Track, TrackJSON } from "./track.ts"
import { Peaks } from "./common/peaks.ts"
import { int } from "./common/lang.ts"
import { Playback } from "./Playback.ts"

// TODO
//  Keyboard Shortcuts
//  Mobile
//  Track download
//  Track rating
//  Main Player with visuals
//  Filter Genre/rating
//  Sorting Name, Date
//  Backend?

(async () => {
    const stages = await Peaks.load("peaks.bin", 196)
    const tracks: ReadonlyArray<Track> = (data as ReadonlyArray<TrackJSON>)
        .map((data: TrackJSON, index: int) => new Track(data, stages[index]))
    const playback = new Playback(tracks)

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