import "./Player.sass"
import { Playback } from "../Playback.ts"
import { useEffect, useRef } from "react"
import { Terminator } from "../common/terminable.ts"
import { Mapping } from "../common/mapping.ts"
import { gainToDb } from "../common/conversion.ts"
import { clamp } from "../common/math.ts"

export type PlayerProps = {
    playback: Playback
}

export const Player = ({ playback }: PlayerProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    useEffect(() => {
        const canvas = canvasRef.current
        if (canvas === null) {return}
        const context = canvas.getContext("2d")!
        const subscription = new Terminator()
        const resizeObserver = new ResizeObserver(() => {
            subscription.terminate()
            const w = canvas.width = canvas.clientWidth * devicePixelRatio
            const h = canvas.height = canvas.clientHeight * devicePixelRatio
            const m = new Mapping.Linear(-48, 0)
            subscription.own(playback.meter.subscribe(values => {
                const l = clamp(m.x(gainToDb(values.peaks[0][0])))
                const r = clamp(m.x(gainToDb(values.peaks[0][1])))
                context.clearRect(0, 0, w, h)
                context.fillStyle = "#333"
                context.fillRect(0, 0, w * l, h / 2 - 2)
                context.fillRect(0, h / 2 + 1, w * r, h / 2)
                const pl = clamp(m.x(gainToDb(values.peakHoldValue[0][0])))
                const pr = clamp(m.x(gainToDb(values.peakHoldValue[0][1])))
                context.fillStyle = "orange"
                if (pl > 0.0) {
                    context.fillRect((w - 2) * pl, 0, 2, h / 2 - 2)
                }
                if (pr > 0.0) {
                    context.fillRect((w - 2) * pr, h / 2 + 1, 2, h / 2)
                }
            }))
        })
        resizeObserver.observe(canvas)
        return () => {
            subscription.terminate()
            resizeObserver.disconnect()
        }
    }, [playback])

    return (
        <div className="player">
            <h1>andré michelle</h1>
            <h2>audiotool discography</h2>
            <h3>2007 - 2023</h3>
            <div className="peak-meter">
                <canvas ref={canvasRef}></canvas>
            </div>
            <p>
                Hi, I'm André Michelle, the creator of audiotool and a passionate web developer. For 16 long years, I
                dedicated myself to enabling people to create music on the web. This website is an archive of all the
                tracks I've ever created in audiotool. Some of these tracks have turned not too bad, and I'm excited
                to share them with you as a celebration of this chapter of my life.<br />
                Now, as I turn the page to embrace new challenges, this space serves as a museum of my past works. It's
                a showcase of dedication, creativity, and the joy of moving forward.
            </p>
        </div>
    )
}