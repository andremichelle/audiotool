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

    const [trackState, setTrackState] = useState<PlaybackState>("paused")

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
                setTrackState(event.state)
                if (event.state === "playing") {
                    progressRef.current?.style.setProperty("--progress", String(event.progress))
                }
            }))
        } else {
            progressRef.current?.style.setProperty("--progress", "0.0")
            playbackSubscription.terminate()
        }
        return () => playbackSubscription.terminate()
    }, [playback, isActiveTrack])

    return (
        <div className={["track-list-item", ...(isActiveTrack ? ["active"] : [])].join(" ")}
             ref={item}
             style={{ "--color": track.color } as React.CSSProperties}
             data-rating={"★".repeat(track.rating)}>
            <div className="cover">
                <img src={track.tinyCoverURL} />
                <img src={track.tinyCoverURL} />
            </div>
            <div className="state"
                 onClick={() => playback.toggle(track)}>
                {playbackStateToIcon(isActiveTrack, trackState)}
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

const playbackStateToIcon = (isCurrentTrack: boolean, playbackState: PlaybackState) => {
    if (isCurrentTrack) {
        switch (playbackState) {
            case "buffering":
                // We cannot use SVGUseElement here since it is terribly slow
                return <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="0">
                        <animate id="spinner_0Nme" begin="0;spinner_ITag.begin+0.4s" attributeName="r" calcMode="spline"
                                 dur="1.2s" values="0;11" keySplines=".52,.6,.25,.99" fill="freeze" />
                        <animate begin="0;spinner_ITag.begin+0.4s" attributeName="opacity" calcMode="spline" dur="1.2s"
                                 values="1;0" keySplines=".52,.6,.25,.99" fill="freeze" />
                    </circle>
                    <circle cx="12" cy="12" r="0">
                        <animate id="spinner_f83A" begin="spinner_0Nme.begin+0.4s" attributeName="r" calcMode="spline"
                                 dur="1.2s" values="0;11" keySplines=".52,.6,.25,.99" fill="freeze" />
                        <animate begin="spinner_0Nme.begin+0.4s" attributeName="opacity" calcMode="spline" dur="1.2s"
                                 values="1;0" keySplines=".52,.6,.25,.99" fill="freeze" />
                    </circle>
                    <circle cx="12" cy="12" r="0">
                        <animate id="spinner_ITag" begin="spinner_0Nme.begin+0.8s" attributeName="r" calcMode="spline"
                                 dur="1.2s" values="0;11" keySplines=".52,.6,.25,.99" fill="freeze" />
                        <animate begin="spinner_0Nme.begin+0.8s" attributeName="opacity" calcMode="spline" dur="1.2s"
                                 values="1;0" keySplines=".52,.6,.25,.99" fill="freeze" />
                    </circle>
                </svg>
            case "playing":
                return <svg>
                    <use href="#pause"></use>
                </svg>
            case "paused":
                return <svg>
                    <use href="#play"></use>
                </svg>
            case "error":
                return <svg>
                    <use href="#error"></use>
                </svg>
        }
    }
    return <svg>
        <use href="#play"></use>
    </svg>
}