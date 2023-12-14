import "./TrackList.sass"
import { TrackListItem } from "./TrackListItem.tsx"
import { useEffect, useState } from "react"
import { Nullable } from "../common/lang.ts"
import { PlaybackService } from "../PlaybackService.ts"
import { TracksService } from "../TrackService.ts"
import { Track } from "../Track.ts"

export type TrackListProps = {
    playback: PlaybackService
    tracksService: TracksService
}

export const TrackList = ({ playback, tracksService }: TrackListProps) => {
    const [tracks, setTracks] = useState<ReadonlyArray<Track>>([])
    const [activeTrack, setActiveTrack] = useState<Nullable<Track>>(null)

    useEffect(() => {
        const playbackSubscription = playback.subscribe(event => {
            if (event.state === "activate") {
                setActiveTrack(event.track.unwrapOrNull())
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
                                      isActiveTrack={isActiveTrack} />
            })}
        </div>)
}