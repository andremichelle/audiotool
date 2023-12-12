import "./TrackListItem.sass"
import { Track } from "./track.ts"
import React, { Dispatch, memo, SetStateAction, useEffect, useRef } from "react"
import { PeaksPainter } from "./waveform.ts"
import { Peaks } from "./common/peaks.ts"
import { Nullable, unitValue } from "./common/lang.ts"
import { PlaybackState } from "./PlaybackState.ts"

export type TrackListItemProps = {
    track: Track
    setCurrentTrackId: Dispatch<SetStateAction<Nullable<string>>>
    isActiveTrack: boolean
    playbackState: PlaybackState
    playbackProgress: unitValue
}

export const TrackListItem = memo(({
                                       track,
                                       setCurrentTrackId,
                                       isActiveTrack,
                                       playbackProgress,
                                       playbackState
                                   }: TrackListItemProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const color = isActiveTrack ? "hsl(30,76%,85%)" : track.color

    useEffect(() => {
        const canvas = canvasRef.current
        if (canvas === null) {return}
        const intersectionObserver = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                intersectionObserver.disconnect()
                paint(canvas, track, color)
            }
        }, { threshold: 0.0 })
        intersectionObserver.observe(canvas)
        return () => intersectionObserver.disconnect()
    }, [isActiveTrack])

    const style = { "--color": color, "--progress": playbackProgress } as React.CSSProperties

    return (
        <div className="track-list-item" style={style} onClick={() => setCurrentTrackId(track.id)}>
            <div className="cover">
                <img src={track.coverURL} />
                <img src={track.coverURL} />
            </div>
            <div className="state">
                <svg>
                    <use href={playbackStateToIcon(isActiveTrack, playbackState)} />
                </svg>
            </div>
            <div className="header">
                <div className="name">{track.name}</div>
                <div className="waveform">
                    <canvas ref={canvasRef}></canvas>
                </div>
            </div>
            <div className="details">
                <div className="genre">{track.genre}</div>
                <div className="date">{new Date(track.date).toLocaleDateString()}</div>
                <div className="bpm">{`${track.bpm} BPM`}</div>
            </div>
        </div>)
})

const paint = (canvas: HTMLCanvasElement, track: Track, color: string): void => {
    const w = canvas.width = canvas.clientWidth * devicePixelRatio
    const h = canvas.height = canvas.clientHeight * devicePixelRatio
    const stages: Peaks.Stages = track.stages
    const context = canvas.getContext("2d")!
    context.fillStyle = color
    context.beginPath()
    PeaksPainter.renderBlocks(context, stages, 0, {
        u0: 0, u1: stages.numFrames,
        v0: -1.5, v1: 1.5,
        x0: 8, x1: w - 8, y0: 0, y1: h + 2
    })
    context.fill()
}

const playbackStateToIcon = (isCurrentTrack: boolean, playbackState: PlaybackState): string => {
    if (isCurrentTrack) {
        switch (playbackState) {
            case PlaybackState.Buffering:
                return "#buffering"
            case PlaybackState.Playing:
                return "#playing"
            case PlaybackState.Paused:
                return "#play"
        }
    }
    return "#play"
}