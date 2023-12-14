import "./TrackListItem.sass"
import React, { memo, useEffect, useRef, useState } from "react"
import { PeaksPainter } from "../waveform.ts"
import { Peaks } from "../common/peaks.ts"
import { PlaybackService, PlaybackState } from "../PlaybackService.ts"
import { clamp } from "../common/math.ts"
import { Track } from "../Track.ts"
import { Terminator } from "../common/terminable.ts"

export type TrackListItemProps = {
    track: Track
    playback: PlaybackService
    isActiveTrack: boolean
}

export const TrackListItem = memo(({ track, isActiveTrack, playback }: TrackListItemProps) => {
    const item = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const progressRef = useRef<HTMLDivElement>(null)

    const [trackState, setTrackState] = useState<PlaybackState>("playing")

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
        const playbackSubscription = new Terminator()
        if (isActiveTrack) {
            item.current?.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" })
            playbackSubscription.own(playback.subscribe(event => {
                if (event.state === "playing") {
                    setTrackState(event.state)
                    progressRef.current?.style.setProperty("--progress", String(event.progress))
                } else if (event.state === "buffering") {
                    setTrackState(event.state)
                } else if (event.state === "paused") {
                    setTrackState(event.state)
                } else if (event.state === "error") {
                    setTrackState(event.state)
                }
            }))
        } else {
            playbackSubscription.terminate()
        }
        return () => playbackSubscription.terminate()
    }, [isActiveTrack, playback])

    return (
        <div className={["track-list-item", ...(isActiveTrack ? ["active"] : [])].join(" ")}
             ref={item}
             style={{ "--color": track.color } as React.CSSProperties}
             data-rating={"★".repeat(track.rating)}>
            <div className="cover">
                <img src={track.tinyCoverURL} />
                <img src={track.tinyCoverURL} />
            </div>
            <div className="state" onClick={() => playback.toggle(track)}>
                <svg>
                    <use href={playbackStateToIcon(isActiveTrack, trackState)} />
                </svg>
            </div>
            <div className="header">
                <div className="name">{track.name}</div>
                <div className="waveform"
                     ref={progressRef}
                     onClick={event => {
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
                return "#pause"
            case "paused":
                return "#play"
            case "error":
                return "#error"
        }
    }
    return "#play"
}