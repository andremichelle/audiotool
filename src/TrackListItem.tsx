import "./TrackListItem.sass"
import { TrackModel } from "./track.ts"
import { Nullable } from "./common/lang.ts"
import { Dispatch, SetStateAction, useEffect, useRef } from "react"

export type TrackListItemProps = {
    track: TrackModel
    setTrack: Dispatch<SetStateAction<Nullable<TrackModel>>>
}

export const TrackListItem = ({ track, setTrack }: TrackListItemProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (canvas === null) {return}
        console.log("init canvas", canvas, canvas.clientWidth, canvas.clientHeight)
        const context = canvas.getContext("2d")!
        // TODO Load and parse pks file
        // fetch(track.pksURL).then(x => x.arrayBuffer()).then(x => Peaks.Stages)
        const paint = () => {
            const w = canvas.width = canvas.clientWidth * devicePixelRatio
            const h = canvas.height = canvas.clientHeight * devicePixelRatio
            // PeaksPainter.renderBlocks(context)
        }
        paint()
        const resizeObserver = new ResizeObserver(paint)
        resizeObserver.observe(canvas)
        return resizeObserver.disconnect()
    }, [])

    return (
        <div className="track-list-item">
            <div className="cover">
                <img src={track.coverURL} />
                <img src={track.coverURL} onClick={() => setTrack(track)} />
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
                <div className="bpm">{track.bpm}</div>
            </div>
        </div>)
}