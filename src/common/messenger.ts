// noinspection JSUnusedGlobalSymbols

import { Notifier, Observable, Observer } from "./observers"
import { Subscription, Terminable } from "./terminable"
import { isDefined } from "./lang"

/**
 * Shared methods for Window, Worker, Worklet, MessagePort, BroadcastChannel.
 */
export type MessagePort = {
    postMessage(message: any): void
    onmessage: ((event: MessageEvent) => void) | null
    onmessageerror: ((event: MessageEvent) => void) | null
}

/**
 * Maps a native port (NativePort) into a Messenger.
 */
export const Messenger = { for: (port: MessagePort): Messenger => new NativeMessenger(port) }

export type Messenger = Observable<any> & Terminable & {
    send(message: any): void
    channel(name: string): Messenger
}

class NativeMessenger implements Messenger {
    readonly #port: MessagePort
    readonly #notifier = new Notifier<any>()

    constructor(port: MessagePort) {
        this.#port = port

        if (isDefined(port.onmessage) || isDefined(port.onmessageerror)) {
            console.error(port)
            throw new Error(`${port} is already wrapped.`)
        }
        port.onmessage = (event: MessageEvent) => this.#notifier.notify(event.data)
        port.onmessageerror = (event: MessageEvent) => {
            console.error(event)
            throw new Error(event.type)
        }
    }

    send(message: any): void {this.#port.postMessage(message)}
    subscribe(observer: Observer<MessageEvent>): Subscription {return this.#notifier.subscribe(observer)}
    channel(name: string): Messenger {return new Channel(this, name)}
    terminate(): void {
        this.#notifier.terminate()
        this.#port.onmessage = null
        this.#port.onmessageerror = null
    }
}

class Channel implements Messenger {
    readonly #messages: Messenger
    readonly #name: string
    readonly #notifier = new Notifier<any>()
    readonly #subscription: Subscription

    constructor(messages: Messenger, name: string) {
        this.#messages = messages
        this.#name = name
        this.#subscription = messages.subscribe(data => {
            if ("message" in data && "channel" in data && data.channel === name) {
                this.#notifier.notify(data.message)
            }
        })
    }

    send(message: any): void {this.#messages.send({ channel: this.#name, message })}
    subscribe(observer: Observer<MessageEvent>): Subscription {return this.#notifier.subscribe(observer)}
    channel(name: string): Messenger {return new Channel(this, name)}
    terminate(): void {
        this.#subscription.terminate()
        this.#notifier.terminate()
    }
}