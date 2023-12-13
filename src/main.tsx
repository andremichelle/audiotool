import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.tsx"
import data from "./data.json"
import { Track, TrackData } from "./track.ts"
import { Peaks } from "./common/peaks.ts"
import { int } from "./common/lang.ts"
import { Playback } from "./Playback.ts"

// TODO
//  Click to jump to position
//  Better colours
//  Date / Duration?
//  Main Player with visuals
//  Filter Genre/rating
//  Sorting Name, Date
//  Track rating
//  Track download
//  Backend?


(async () => {
    const stages = await Peaks.load("peaks.bin", 196)
    const tracks: ReadonlyArray<Track> = (data as ReadonlyArray<TrackData>)
        .map((data: TrackData, index: int) => new Track(data, stages[index]))
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