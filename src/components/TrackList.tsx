import "./TrackList.sass"
import { TrackListItem } from "./TrackListItem.tsx"
import { useEffect, useState } from "react"
import { Nullable, unitValue } from "../common/lang.ts"
import { Playback, PlaybackState } from "../Playback.ts"
import { TracksService } from "../TrackService.ts"
import { Track } from "../Track.ts"

export type TrackListProps = {
    playback: Playback
    tracksService: TracksService
}

export const TrackList = ({ playback, tracksService }: TrackListProps) => {
    const [tracks, setTracks] = useState<ReadonlyArray<Track>>([])
    const [activeTrack, setActiveTrack] = useState<Nullable<Track>>(null)
    const [activeTrackState, setActiveTrackState] = useState<PlaybackState>("playing")
    const [activeTrackProgress, setActiveTrackProgress] = useState<unitValue>(0.0)

    useEffect(() => {
        const playbackSubscription = playback.subscribe(event => {
            if (event.state === "activate") {
                setActiveTrack(event.track.unwrapOrNull())
                setActiveTrackProgress(0.0)
            } else if (event.state === "playing") {
                setActiveTrackState(event.state)
                setActiveTrackProgress(event.progress)
            } else if (event.state === "buffering") {
                setActiveTrackState(event.state)
            } else if (event.state === "paused") {
                setActiveTrackState(event.state)
            } else if (event.state === "error") {
                setActiveTrackProgress(0.0)
                setActiveTrackState(event.state)
            }
        })
        setActiveTrack(playback.active.unwrapOrNull())
        const trackServiceSubscription = tracksService.subscribe(service => setTracks(service.tracks()))
        setTracks(tracksService.tracks())
        return () => {
            playbackSubscription.terminate()
            trackServiceSubscription.terminate()
        }
    }, [playback, tracksService])

    return (
        <div className="track-list">
            {tracks.map(track => {
                const isActiveTrack = track.id === activeTrack?.id
                return <TrackListItem key={track.id}
                                      track={track}
                                      playback={playback}
                                      isActiveTrack={isActiveTrack}
                                      playbackState={isActiveTrack ? activeTrackState : "paused"}
                                      playbackProgress={isActiveTrack ? activeTrackProgress : 0.0} />
            })}
        </div>)
}