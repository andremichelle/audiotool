export interface Mapping<Y> {
    y(x: number): Y
    x(y: Y): number
    clamp(y: Y): Y
}

export namespace Mapping {
    export class Linear implements Mapping<number> {
        static Identity = new Linear(0.0, 1.0)
        static Bipolar = new Linear(-1.0, 1.0)
        static Percent = new Linear(0.0, 100.0)
        readonly #range: number
        constructor(readonly min: number, readonly max: number) {this.#range = this.max - this.min}
        x(y: number): number {return (y - this.min) / this.#range}
        y(x: number): number {return this.min + x * this.#range}
        clamp(y: number): number {return Math.min(this.max, Math.max(this.min, y))}
    }

    export class Exponential implements Mapping<number> {
        readonly #range: number
        constructor(readonly min: number, readonly max: number) {this.#range = Math.log(this.max / this.min)}
        x(y: number): number {return Math.log(y / this.min) / this.#range}
        y(x: number): number {return this.min * Math.exp(x * this.#range)}
        clamp(y: number): number {return Math.min(this.max, Math.max(this.min, y))}
    }

    export const Boolean = new class implements Mapping<boolean> {
        x(y: boolean): number {return y ? 1.0 : 0.0}
        y(x: number): boolean {return x >= 0.5}
        clamp(y: boolean): boolean {return y}
    }
}