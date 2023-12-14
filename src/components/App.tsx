import "./App.sass"
import { TrackList } from "./TrackList.tsx"
import { PlaybackService } from "../PlaybackService.ts"
import { OutletBox } from "./OutletBox.tsx"
import { TracksService } from "../TrackService.ts"

export type AppProps = { tracksService: TracksService, playback: PlaybackService }

export const App = ({ tracksService, playback }: AppProps) => {
    return (
        <div className="app">
            <header></header>
            <main>
                <div></div>
                <TrackList tracksService={tracksService} playback={playback}></TrackList>
                <OutletBox playback={playback} tracksService={tracksService} />
            </main>
            <footer></footer>
        </div>
    )
}