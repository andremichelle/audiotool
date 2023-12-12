import "./TrackList.sass"
import { TrackModel } from "./track.ts"
import { TrackListItem } from "./TrackListItem.tsx"
import { Dispatch, SetStateAction } from "react"
import { Nullable } from "./common/lang.ts"

export type TrackListProps = {
    tracks: ReadonlyArray<TrackModel>
    setTrack: Dispatch<SetStateAction<Nullable<TrackModel>>>
}

export const TrackList = ({ tracks, setTrack }: TrackListProps) => {
    return (
        <div className="track-list">
            {tracks.map(track => <TrackListItem track={track} setTrack={setTrack} key={track.id} />)}
        </div>)
}