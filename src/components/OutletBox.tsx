import "./OutletBox.sass"
import { PlaybackService } from "../PlaybackService.ts"
import { useEffect, useRef } from "react"
import { Terminator } from "../common/terminable.ts"
import { Mapping } from "../common/mapping.ts"
import { gainToDb } from "../common/conversion.ts"
import { clamp } from "../common/math.ts"
import { MeterValues } from "../waa/meter-node.ts"
import { Checkbox } from "./Checkbox.tsx"

import { Genres } from "../genres.ts"
import { TracksService } from "../TrackService.ts"

export type PlayerProps = {
    playback: PlaybackService
    tracksService: TracksService
}

export const OutletBox = ({ playback, tracksService }: PlayerProps) => {
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
            const observer = (values: Omit<MeterValues, "squares">) => {
                const l = clamp(m.x(gainToDb(values.peaks[0][0])))
                const r = clamp(m.x(gainToDb(values.peaks[0][1])))
                context.clearRect(0, 0, w, h)
                context.fillStyle = "#222"
                context.fillRect(0, 0, w, h / 2 - 2)
                context.fillRect(0, h / 2 + 1, w, h / 2)
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
            }
            observer({ peaks: [new Float32Array([0, 0])], peakHoldValue: [new Float32Array([0, 0])] })
            subscription.own(playback.meter.subscribe(observer))
        })
        resizeObserver.observe(canvas)
        return () => {
            subscription.terminate()
            resizeObserver.disconnect()
        }
    }, [playback])

    return (
        <div className="outlet-box">
            <h1>andré michelle</h1>
            <h2>audiotool discography</h2>
            <h3>2007 - 2023</h3>
            <div className="peak-meter">
                <canvas ref={canvasRef}></canvas>
            </div>
            <p>
                Hi, I'm André Michelle, the originator of audiotool.com and a passionate web developer. For the last 16
                years, I dedicated myself to enabling people to create music in the web for free.
            </p>
            <p>
                This space serves as a museum of my own music on audiotool. It's a history of creativity, dedication,
                failure, and the joy of moving forward.
            </p>
            <fieldset className="filter">
                {Object.keys(Genres)
                    .map(genre => <Checkbox label={genre} key={genre} onChange={(checked: boolean) => {
                        if (checked) {
                            tracksService.addInclusiveFilter(Genres[genre].filter)
                        } else {
                            tracksService.removeInclusiveFilter(Genres[genre].filter)
                        }
                    }} defaultChecked={true} />)}
                <Checkbox label={"At least one ★"}
                          onChange={(checked: boolean) => {
                              if (checked) {
                                  tracksService.addExclusiveFilter(TracksService.AtLeastOneStar)
                              } else {
                                  tracksService.removeExclusiveFilter(TracksService.AtLeastOneStar)
                              }
                          }} />
                <Checkbox label={"Latest To Old"}
                          onChange={(checked: boolean) => {
                              tracksService.reversed = checked
                          }} />
            </fieldset>
        </div>
    )
}