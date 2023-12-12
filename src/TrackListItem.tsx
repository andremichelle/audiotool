import "./TrackListItem.sass"
import { Track } from "./track.ts"
import { useEffect, useRef } from "react"
import { PeaksPainter } from "./waveform.ts"
import { Peaks } from "./common/peaks.ts"

export type TrackListItemProps = {
    track: Track
}

export const TrackListItem = ({ track }: TrackListItemProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (canvas === null) {return}
        const intersectionObserver = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                intersectionObserver.disconnect()
                const w = canvas.width = canvas.clientWidth * devicePixelRatio
                const h = canvas.height = canvas.clientHeight * devicePixelRatio
                const stages: Peaks.Stages = track.stages
                const context = canvas.getContext("2d")!
                context.beginPath()
                context.fillStyle = "rgb(229, 132, 61)"
                PeaksPainter.renderBlocks(context, stages, 0, {
                    u0: 0, u1: stages.numFrames,
                    v0: -1.5, v1: 1.5,
                    x0: 8, x1: w - 8, y0: 0, y1: h + 2
                })
                context.fill()
            }
        }, { threshold: 0.0 })
        intersectionObserver.observe(canvas)
        return () => intersectionObserver.disconnect()
    }, [])

    return (
        <div className="track-list-item">
            <div className="cover">
                <img src={track.coverURL} />
                <img src={track.coverURL} />
            </div>
            <div className="state">
                <svg>
                    <use href="#play" />
                </svg>
            </div>
            <div className="header">
                <div className="name">{track.name}</div>
                <canvas ref={canvasRef} className="waveform"></canvas>
            </div>
            <div className="details">
                <div className="genre">{track.genre}</div>
                <div className="date">{new Date(track.date).toLocaleDateString()}</div>
                <div className="bpm">{`${track.bpm} BPM`}</div>
            </div>
        </div>)
}