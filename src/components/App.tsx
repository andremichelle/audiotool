import "./App.sass"
import { TrackList } from "./TrackList.tsx"
import { Playback } from "../Playback.ts"
import { Player } from "./Player.tsx"
import { TracksService } from "../track-service.ts"

export type AppProps = { tracksService: TracksService, playback: Playback }

export const App = ({ tracksService, playback }: AppProps) => {
    return (
        <div className="app">
            <header></header>
            <main>
                <div></div>
                <TrackList trackService={tracksService} playback={playback}></TrackList>
                <Player playback={playback} tracksService={tracksService} />
            </main>
            <footer></footer>
        </div>
    )
}