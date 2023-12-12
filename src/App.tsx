import "./App.sass"
import data from "./data.json"
import { TrackList } from "./TrackList.tsx"
import { TrackData, TrackModel } from "./track.ts"
import { useEffect, useRef, useState } from "react"
import { Nullable } from "./common/lang.ts"

const tracks = (data as ReadonlyArray<TrackData>).map(data => new TrackModel(data))

export const App = () => {
    const audioRef = useRef<HTMLAudioElement>(null)
    const [track, setTrack] = useState<Nullable<TrackModel>>(null)
    const [isPlaying, setIsPlaying] = useState(true)

    useEffect(() => {
        const audio = audioRef.current
        if (audio === null) {return}
        const wasPlaying = isPlaying
        audio.src = track?.mp3URL ?? ""
        if (wasPlaying) {
            audio.play().catch()
        }
    }, [track])

    return (
        <>
            <header>
                <audio ref={audioRef}
                       onPlay={() => setIsPlaying(true)}
                       onPause={() => setIsPlaying(false)}
                       controls></audio>
                <button onClick={() => {}}>{isPlaying ? "Pause" : "Play"}</button>
            </header>
            <TrackList tracks={tracks} setTrack={setTrack}></TrackList>
            <footer></footer>
        </>
    )
}

export default App