import "./App.sass"
import { TrackList } from "./TrackList.tsx"
import { Playback } from "../Playback.ts"
import { Player } from "./Player.tsx"
import { TracksService } from "../track-service.ts"

export type AppProps = { trackService: TracksService, playback: Playback }

export const App = ({ trackService, playback }: AppProps) => {
    return (
        <div className="app">
            <header></header>
            <main>
                <div></div>
                <TrackList trackService={trackService} playback={playback}></TrackList>
                <Player playback={playback} />
            </main>
            <footer></footer>
        </div>
    )
}