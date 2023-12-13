import "./TrackList.sass"
import { Track } from "./track.ts"
import { TrackListItem } from "./TrackListItem.tsx"
import { useEffect, useState } from "react"
import { Nullable, unitValue } from "./common/lang.ts"
import { PlaybackState } from "./PlaybackState.ts"
import { Playback } from "./Playback.ts"

export type TrackListProps = {
    tracks: ReadonlyArray<Track>
    playback: Playback
}

export const TrackList = ({ tracks, playback }: TrackListProps) => {
    const [activeTrack, setActiveTrack] = useState<Nullable<Track>>(null)
    const [activeTrackState, setActiveTrackState] = useState<PlaybackState>(PlaybackState.Playing)
    const [activeTrackProgress, setActiveTrackProgress] = useState<unitValue>(0.0)

    useEffect(() => {
        const subscription = playback.subscribe(event => {
            if (event.type === "activate") {
                setActiveTrack(event.track.unwrapOrNull())
                setActiveTrackProgress(0.0)
            } else if (event.type === "playing") {
                setActiveTrackState(PlaybackState.Playing)
                setActiveTrackProgress(event.progress)
            } else if (event.type === "paused") {
                setActiveTrackState(PlaybackState.Paused)
            } else if (event.type === "error") {
                setActiveTrackProgress(0.0)
                setActiveTrackState(PlaybackState.Error)
            }
        })
        return () => subscription.terminate()
    }, [playback])

    return (
        <div className="track-list">
            {tracks.map(track => {
                const isActiveTrack = track.id === activeTrack?.id
                return <TrackListItem key={track.id}
                                      track={track}
                                      playback={playback}
                                      isActiveTrack={isActiveTrack}
                                      playbackState={isActiveTrack ? activeTrackState : PlaybackState.Paused}
                                      playbackProgress={isActiveTrack ? activeTrackProgress : 0.0} />
            })}
        </div>)
}