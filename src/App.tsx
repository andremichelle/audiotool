import "./App.sass"
import { TrackList } from "./TrackList.tsx"
import { Track } from "./track.ts"
import { Playback } from "./Playback.ts"

export type AppProps = { tracks: ReadonlyArray<Track>, playback: Playback }

export const App = ({ tracks, playback }: AppProps) => {
    return (
        <>
            <TrackList tracks={tracks} playback={playback}></TrackList>
        </>
    )
}

export default App