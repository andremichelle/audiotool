import { Func, int } from "./lang"

export class Arrays {
    static readonly clear = <T>(array: Array<T>): void => {array.splice(0, array.length)}
    static readonly create = <T>(factory: Func<int, T>, n: int): Array<T> => {
        const array: T[] = new Array<T>(n)
        for (let i: int = 0; i < n; i++) {array[i] = factory(i)}
        return array
    }
}