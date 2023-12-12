import "./TrackListItem.sass"
import { TrackModel } from "./track.ts"
import { Nullable } from "./common/lang.ts"
import { Dispatch, SetStateAction } from "react"

export type TrackListItemProps = {
    track: TrackModel
    setTrack: Dispatch<SetStateAction<Nullable<TrackModel>>>
}

export const TrackListItem = ({ track, setTrack }: TrackListItemProps) => {
    return (
        <div className="track-list-item">
            <div className="cover">
                <img src={track.coverURL} />
                <img src={track.coverURL} onClick={() => setTrack(track)} />
            </div>
            <div className="state">
                <svg>
                    <use href="#play" />
                </svg>
            </div>
            <div className="name">{track.name}</div>
            <div className="details">
                <div className="genre">{track.genre}</div>
                <div className="date">{new Date(track.date).toLocaleDateString()}</div>
                <div className="bpm">{track.bpm}</div>
            </div>
        </div>)
}