import "./App.sass"
import { TrackList } from "./TrackList.tsx"
import { Track } from "./track.ts"

export type AppProps = { tracks: ReadonlyArray<Track> }

export const App = ({ tracks }: AppProps) => {
    return (
        <>
            <TrackList tracks={tracks}></TrackList>
        </>
    )
}

export default App