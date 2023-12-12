import { int, Procedure, unitValue } from "./lang"
import { Arrays } from "./arrays"

export type ProgressHandler = Procedure<unitValue>
export const SilentProgressHandler: ProgressHandler = _ => {}

export namespace Progress {
    export const split = (progress: ProgressHandler, count: int): ReadonlyArray<ProgressHandler> => {
        const total = new Float32Array(count)
        return Arrays.create(index => (value: number) => {
            total[index] = Math.min(1.0, Math.max(0.0, value))
            progress(total.reduce((total, value) => total + value, 0.0) / count)
        }, count)
    }
}