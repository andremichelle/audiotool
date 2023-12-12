export type Resolve<T> = (value: T) => void
export type Reject = (reason?: unknown) => void
export type ExecutorTuple<T> = { resolve: Resolve<T>; reject: Reject }
export type PromiseExecutor<T> = (resolve: Resolve<T>, reject: Reject) => void