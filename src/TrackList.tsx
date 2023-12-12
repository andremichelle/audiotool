import "./TrackList.sass"
import { Track } from "./track.ts"
import { TrackListItem } from "./TrackListItem.tsx"
import { useEffect, useState } from "react"
import { Nullable, unitValue } from "./common/lang.ts"
import { PlaybackState } from "./PlaybackState.ts"

export type TrackListProps = {
    tracks: ReadonlyArray<Track>
}

export const TrackList = ({ tracks }: TrackListProps) => {
    const [activeTrack, setActiveTrack] = useState<Nullable<Track>>(null)
    const [activeTrackState, setActiveTrackState] = useState<PlaybackState>(PlaybackState.Playing)
    const [activeTrackProgress, setActiveTrackProgress] = useState<unitValue>(0.5)

    useEffect(() => {
        const intervalId = setInterval(() => setActiveTrackProgress(value => (value + 0.01) % 1.0), 20)
        return () => clearInterval(intervalId)
    }, [])

    return (
        <div className="track-list">
            {tracks.map(track => {
                const isActiveTrack = track.id === activeTrack?.id
                return <TrackListItem track={track} key={track.id}
                                      isActiveTrack={isActiveTrack}
                                      playbackState={isActiveTrack ? activeTrackState : PlaybackState.Paused}
                                      playbackProgress={isActiveTrack ? activeTrackProgress : 0.0}
                                      setActiveTrack={setActiveTrack} />
            })}
        </div>)
}