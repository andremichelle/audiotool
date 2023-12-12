import "./TrackList.sass"
import { Track } from "./track.ts"
import { TrackListItem } from "./TrackListItem.tsx"
import { useState } from "react"
import { Nullable } from "./common/lang.ts"

export type TrackListProps = {
    tracks: ReadonlyArray<Track>
}

export const TrackList = ({ tracks }: TrackListProps) => {
    const [currentTrackId, setCurrentTrackId] = useState<Nullable<string>>(null)

    return (
        <div className="track-list">
            {tracks.map(track => <TrackListItem track={track} key={track.id}
                                                isPlaying={track.id === currentTrackId}
                                                setCurrentTrackId={setCurrentTrackId} />)}
        </div>)
}