/* eslint-disable @typescript-eslint/no-unused-vars */
// noinspection JSUnusedGlobalSymbols

import { Func, int, isDefined, Nullish, Predicate, Procedure } from "./lang"

export class Iterables {
    static* empty<T>(): Iterable<T> {}

    static one<T>(value: T): Iterable<T> { return [value] }

    static count<T>(iterable: Iterable<T>): int {
        let count: int = 0 | 0
        for (const _ of iterable) {count++}
        return count
    }

    static some<T>(iterable: Iterable<T>, predicate: (value: T) => boolean): boolean {
        for (const value of iterable) {
            if (predicate(value)) {return true}
        }
        return false
    }

    static every<T>(iterable: Iterable<T>, predicate: (value: T) => boolean): boolean {
        for (const value of iterable) {
            if (!predicate(value)) {return false}
        }
        return true
    }

    static reduce<T, U>(
        iterable: Iterable<T>,
        callback: (previous: U, value: T, index: int) => U, initialValue: U): U {
        let accumulator = initialValue
        let index: int = 0
        for (const value of iterable) {accumulator = callback(accumulator, value, index++)}
        return accumulator
    }

    static includes<T>(iterable: Iterable<T>, include: T): boolean {
        for (const value of iterable) {if (value === include) {return true}}
        return false
    }

    static forEach<T>(iterable: Iterable<T>, procedure: Procedure<T>): void {
        for (const value of iterable) {procedure(value)}
    }

    static map<T, U>(iterable: Iterable<T>, map: (value: T, index: int) => U): Array<U> {
        const result: U[] = []
        for (const value of iterable) {result.push(map(value, result.length))}
        return result
    }

    static filter<T>(iterable: Iterable<T>, fn: Predicate<T>): T[] {
        const result: Array<T> = []
        for (const value of iterable) {if (fn(value)) {result.push(value)}}
        return result
    }

    static filterMap<T, U>(iterable: Iterable<T>, fn: Func<T, Nullish<U>>): U[] {
        const result: Array<U> = []
        for (const value of iterable) {
            const mapped: Nullish<U> = fn(value)
            if (isDefined(mapped)) {result.push(mapped)}
        }
        return result
    }

    static reverse<T>(iterable: Iterable<T>): Iterable<T> {
        const result: T[] = []
        for (const value of iterable) {result.push(value)}
        return result
    }
}