import "./App.sass"
import { TrackList } from "./TrackList.tsx"
import { Track } from "../track.ts"
import { Playback } from "../Playback.ts"
import { Player } from "./Player.tsx"

export type AppProps = { tracks: ReadonlyArray<Track>, playback: Playback }

export const App = ({ tracks, playback }: AppProps) => {
    return (
        <div className="app">
            <header></header>
            <main>
                <div></div>
                <TrackList tracks={tracks} playback={playback}></TrackList>
                <Player />
            </main>
            <footer></footer>
        </div>
    )
}