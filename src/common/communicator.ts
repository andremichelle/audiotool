/* eslint-disable */
import { Subscription, Terminable } from "./terminable"
import { asDefined, assert, int, panic } from "./lang"
import { Iterables } from "./iterables"
import { Messenger } from "./messenger.ts"
import { ExecutorTuple } from "./promises.ts"

/**
 * Communicator provides a one-way type-safe communication between Window, Worker, MessagePort, BroadcastChannel.
 */
export namespace Communicator {
    export interface Dispatcher {
        dispatchAndForget: <FN extends (..._: Parameters<FN>) => void>(func: FN, ...args: Parameters<FN>) => void
        dispatchAndReturn: <FN extends (..._: Parameters<FN>) => Promise<RET>, RET>(func: FN, ...args: Parameters<FN>) => Promise<RET>
    }

    export const createProtocolCaller = <PROTOCOL>(messenger: Messenger, bind: (dispatcher: Dispatcher) => PROTOCOL): PROTOCOL =>
        bind(new Caller(messenger))

    export const createProtocolExecutor = <PROTOCOL>(messenger: Messenger, protocol: PROTOCOL): Executor<PROTOCOL> =>
        new Executor(messenger, protocol)

    class Caller<PROTOCOL> implements Dispatcher, Terminable {
        readonly #messenger: Messenger
        readonly #expected = new Map<int, ReturnData>()
        readonly #subscription: Subscription

        #returnId: int = 0

        constructor(messenger: Messenger) {
            this.#messenger = messenger
            this.#subscription = messenger.subscribe(this.#messageHandler)
        }

        terminate(): void {this.#subscription.terminate()}

        readonly dispatchAndForget = <F extends (..._: Parameters<F>) => void>
        (func: F, ...args: Parameters<F>): void => this.#messenger.send({
            type: "call",
            returnId: false,
            func: func.name as keyof PROTOCOL,
            args: Iterables.map(args, arg => ({ value: arg }))
        })

        readonly dispatchAndReturn = <F extends (..._: Parameters<F>) => Promise<R>, R>
        (func: F, ...args: Parameters<F>): Promise<R> => new Promise<R>((resolve, reject) => {
            const entries = Iterables.reduce(args, (callbacks: [int, Function][], arg: any, index: int) => {
                if (typeof arg === "function") {callbacks.push([index, arg])}
                return callbacks
            }, [])
            this.#expected.set(this.#returnId, {
                executorTuple: { resolve, reject },
                callbacks: new Map<int, Function>(entries)
            })
            this.#messenger.send({
                type: "call",
                returnId: this.#returnId,
                func: func.name as keyof PROTOCOL,
                args: Iterables.map(args, (arg, index) =>
                    typeof arg === "function" ? ({ callback: index }) : ({ value: arg }))
            })
            this.#returnId++
        })

        readonly #messageHandler = (message: Receipt | Callback) => {
            const returns: ReturnData | undefined = this.#expected.get(message.returnId)
            if (returns === undefined) {
                console.warn(`Promise has already been resolved. ${JSON.stringify(message)}`)
            } else if (message.type === "receipt") {
                const executor: ExecutorTuple<any> = returns.executorTuple
                if (message.reject !== undefined) {
                    executor.reject(message.reject)
                } else {
                    // allowed to be undefined for Promise<void>
                    executor.resolve(message.resolve)
                }
                this.#expected.delete(message.returnId)
            } else if (message.type === "callback") {
                returns.callbacks?.get(message.funcAt)!.apply(this, message.args)
            }
        }
    }

    export class Executor<PROTOCOL> implements Terminable {
        readonly #messenger: Messenger
        readonly #protocol: PROTOCOL
        readonly #subscription: Subscription

        constructor(messenger: Messenger, protocol: PROTOCOL) {
            this.#messenger = messenger
            this.#protocol = protocol
            this.#subscription = messenger.subscribe(this.#messageHandler)
        }

        terminate(): void {this.#subscription.terminate()}

        readonly #messageHandler = (message: Call<PROTOCOL>) => {
            assert(message.type === "call", () => "Message type must be 'call'")
            // Check, if the implementation is a simple object or a class instance to properly access the methods
            const object = Object.getPrototypeOf(this.#protocol) === Object.getPrototypeOf({})
                ? this.#protocol
                : Object.getPrototypeOf(this.#protocol)
            const func = asDefined(
                object[message.func] as Function,
                `${message.func.toString()} does not exists on ${this.#protocol}`)
            const returnId: number | false = message.returnId
            if (returnId === false) {
                func.apply(this.#protocol, message.args.map((arg: Arg) => {
                    return "value" in arg
                        ? arg.value
                        : panic(`${message.func.toString()} does not allow callbacks (no promise).`)
                }))
            } else {
                try {
                    const promise: Promise<any> = func.apply(this.#protocol, message.args
                        .map(arg => "callback" in arg
                            ? (...args: any[]) => this.#sendCallback(returnId, arg.callback, args)
                            : arg.value))
                    promise.then(value => this.#sendResolve(returnId, value), reason => this.#sendReject(returnId, reason))
                } catch (reason) {this.#sendReject(returnId, reason)}
            }
        }

        readonly #sendResolve = (returnId: number, value: any): void => {
            this.#messenger.send({ type: "receipt", returnId, resolve: value })
        }

        readonly #sendReject = (returnId: number, reason: any): void => {
            this.#messenger.send({ type: "receipt", returnId, reject: reason })
        }

        readonly #sendCallback = (returnId: number, func: int, args: any[]): void => {
            this.#messenger.send({ type: "callback", returnId, funcAt: func, args })
        }
    }

    interface Call<T> {
        type: "call"
        returnId: int | false
        func: keyof T
        args: Arg[]
    }

    interface Callback {
        type: "callback"
        returnId: int
        funcAt: int
        args: Arg[]
    }

    interface Receipt {
        type: "receipt"
        returnId: int
        resolve?: any
        reject?: any
    }

    type ReturnData = {
        callbacks?: Map<int, Function>
        executorTuple: ExecutorTuple<any>
    }

    type Arg = { value: any } | { callback: int }
}