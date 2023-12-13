import "./TrackListItem.sass"
import { Track } from "../track.ts"
import React, { memo, useEffect, useRef } from "react"
import { PeaksPainter } from "../waveform.ts"
import { Peaks } from "../common/peaks.ts"
import { unitValue } from "../common/lang.ts"
import { Playback, PlaybackState } from "../Playback.ts"
import { clamp } from "../common/math.ts"

export type TrackListItemProps = {
    track: Track
    isActiveTrack: boolean
    playback: Playback
    playbackState: PlaybackState
    playbackProgress: unitValue
}

export const TrackListItem = memo(({
                                       track,
                                       isActiveTrack,
                                       playback,
                                       playbackProgress,
                                       playbackState
                                   }: TrackListItemProps) => {
    const item = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (canvas === null) {return}
        const intersectionObserver = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                intersectionObserver.disconnect()
                paint(canvas, track)
            }
        }, { threshold: 0.0 })
        intersectionObserver.observe(canvas)
        return () => intersectionObserver.disconnect()
    }, [track])

    useEffect(() => {
        if (isActiveTrack) {
            item.current?.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" })
        }
    }, [isActiveTrack])

    const style = { "--color": track.color, "--progress": playbackProgress } as React.CSSProperties

    return (
        <div className={`track-list-item ${isActiveTrack ? "active" : ""}`} style={style} ref={item}
             data-rating={"★".repeat(track.rating)}>
            <div className="cover">
                <img src={track.tinyCoverURL} />
                <img src={track.tinyCoverURL} />
            </div>
            <div className="state">
                <svg onClick={() => playback.toggle(track)}>
                    <use href={playbackStateToIcon(isActiveTrack, playbackState)} />
                </svg>
            </div>
            <div className="header">
                <div className="name">{track.name}</div>
                <div className="waveform" onClick={event => {
                    const rect = event.currentTarget.getBoundingClientRect()
                    playback.playTrackFrom(track, clamp((event.clientX - rect.left) / rect.width))
                }}>
                    <canvas ref={canvasRef}></canvas>
                </div>
            </div>
            <div className="details">
                <div className="genre">{track.genre}</div>
                <div className="date">
                    <svg>
                        <use href="#create" />
                    </svg>
                    <span>{track.dateString}</span>
                </div>
                <div className="duration">
                    <svg>
                        <use href="#duration" />
                    </svg>
                    <span>{track.durationString}</span>
                </div>
                <div className="bpm">{`${track.bpm} BPM`}</div>
            </div>
        </div>)
})

const paint = (canvas: HTMLCanvasElement, track: Track): void => {
    const w = canvas.width = canvas.clientWidth * devicePixelRatio
    const h = canvas.height = canvas.clientHeight * devicePixelRatio
    const stages: Peaks.Stages = track.stages
    const context = canvas.getContext("2d")!
    context.fillStyle = track.color
    context.beginPath()
    PeaksPainter.renderBlocks(context, stages, 0, {
        u0: 0, u1: stages.numFrames,
        v0: -1.5, v1: 1.5,
        x0: 0, x1: w, y0: 0, y1: h
    })
    context.fill()
}

const playbackStateToIcon = (isCurrentTrack: boolean, playbackState: PlaybackState): string => {
    if (isCurrentTrack) {
        switch (playbackState) {
            case "buffering":
                return "#buffering"
            case "playing":
                return "#playing"
            case "paused":
                return "#play"
            case "error":
                return "#error"
        }
    }
    return "#play"
}