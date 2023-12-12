import "./TrackList.sass"
import { Track } from "./track.ts"
import { TrackListItem } from "./TrackListItem.tsx"
import { useState } from "react"
import { Nullable, unitValue } from "./common/lang.ts"
import { PlaybackState } from "./PlaybackState.ts"

export type TrackListProps = {
    tracks: ReadonlyArray<Track>
}

export const TrackList = ({ tracks }: TrackListProps) => {
    const [activeTrackId, setActiveTrackId] = useState<Nullable<string>>(null)
    const [activeTrackState, setActiveTrackState] = useState<PlaybackState>(PlaybackState.Playing)
    const [activeTrackProgress, setActiveTrackProgress] = useState<unitValue>(0.5)
    return (
        <div className="track-list">
            {tracks.map(track => {
                const isActiveTrack = track.id === activeTrackId
                return <TrackListItem track={track} key={track.id}
                                      isActiveTrack={isActiveTrack}
                                      playbackState={isActiveTrack ? activeTrackState : PlaybackState.Paused}
                                      playbackProgress={isActiveTrack ? activeTrackProgress : 0.0}
                                      setCurrentTrackId={setActiveTrackId} />
            })}
        </div>)
}