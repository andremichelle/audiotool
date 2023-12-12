import { int } from "./common/lang.ts"
import { Peaks } from "./common/peaks.ts"

export namespace PeaksPainter {
    export interface Path {
        moveTo(x: number, y: number): void
        lineTo(x: number, y: number): void
        fillRect(x: number, y: number, width: number, height: number): void
        roundRect(x: number, y: number, w: number, h: number, radii?: number): void;
    }

    export interface Layout {
        x0: number,
        x1: number,
        u0: number,
        u1: number
        y0: number,
        y1: number,
        v0: number,
        v1: number
    }

    export const renderBlocks = (
        path: Path,
        stages: Peaks.Stages,
        channelIndex: int,
        { u0, u1, v0, v1, x0, x1, y0, y1 }: Layout
    ): void => {
        const unitsEachPixel = (u1 - u0) / (x1 - x0)
        const width = 4
        const stage = stages.nearest(unitsEachPixel * width)
        if (stage === null) {
            return
        }
        const scale = (y1 - y0 - 1.0) / (v1 - v0)
        const unitsEachPeak = stage.unitsEachPeak()
        const pixelOverFlow = x0 - Math.floor(x0)
        const peaksEachPixel = unitsEachPixel / unitsEachPeak
        let from = Math.floor((u0 - pixelOverFlow * unitsEachPixel) / unitsEachPixel) * peaksEachPixel
        let indexFrom: int = Math.floor(from)
        let min: number = 0
        let max: number = 0
        const channel = stages.channels[channelIndex]
        for (let x = Math.floor(x0); x < x1; x += width) {
            const to = from + peaksEachPixel * width
            const indexTo = Math.floor(to)
            while (indexFrom < indexTo) {
                const bits = channel[stage.dataOffset + indexFrom++]
                min = Math.min(Peaks.unpack(bits, 0), min)
                max = Math.max(Peaks.unpack(bits, 1), max)
            }
            const yMin = y0 + Math.floor((min - v0) * scale)
            const yMax = y0 + Math.floor((max - v0) * scale)
            path.roundRect(x, Math.min(yMin, yMax), width - 1, Math.abs(yMax - yMin) || 1, Number.MAX_SAFE_INTEGER)
            const tmp = max
            max = min
            min = tmp
            from = to
            indexFrom = indexTo
        }
    }
}