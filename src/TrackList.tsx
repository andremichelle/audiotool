import "./TrackList.sass"
import { Track } from "./track.ts"
import { TrackListItem } from "./TrackListItem.tsx"

export type TrackListProps = {
    tracks: ReadonlyArray<Track>
}

export const TrackList = ({ tracks }: TrackListProps) => {
    return (
        <div className="track-list">
            {tracks.map(track => <TrackListItem track={track} key={track.id} />)}
        </div>)
}