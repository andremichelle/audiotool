// noinspection JSUnusedGlobalSymbols
/* eslint-disable @typescript-eslint/no-unused-vars */

import { byte, double, float, int, Nullable, short } from "./lang"

export interface DataOutput {
    writeByte(value: byte): void
    writeShort(value: short): void
    writeInt(value: int): void
    writeLong(value: bigint): void
    writeFloat(value: float): void
    writeDouble(value: double): void
    writeBoolean(value: boolean): void
    writeBytes(bytes: Int8Array): void
}

export interface DataInput {
    readByte(): byte
    readShort(): short
    readInt(): int
    readLong(): bigint
    readFloat(): float
    readDouble(): double
    readBoolean(): boolean
    readBytes(array: Int8Array): void
}

export interface ByteOutput extends DataOutput {
    littleEndian: boolean
    toArrayBuffer(): ArrayBuffer
}

export interface ByteInput extends DataInput {
    littleEndian: boolean
    position: int
    remaining(): int
    skip(count: int): void
}

export class ByteArrayOutput implements DataOutput {
    littleEndian: boolean = false

    private view: DataView
    private position: int = 0

    constructor(buffer: ArrayBuffer, byteOffset: int = 0) {
        this.view = new DataView(buffer, byteOffset)
    }

    rewind(): void {
        this.position = 0
    }

    writeByte(value: byte): void {
        this.view.setInt8(this.position++, value)
    }

    writeShort(value: short): void {
        this.view.setInt16(this.position, value, this.littleEndian)
        this.position += Uint16Array.BYTES_PER_ELEMENT
    }

    writeInt(value: int): void {
        this.view.setInt32(this.position, value, this.littleEndian)
        this.position += Uint32Array.BYTES_PER_ELEMENT
    }

    writeLong(value: bigint): void {
        this.view.setBigInt64(this.position, value, this.littleEndian)
        this.position += BigUint64Array.BYTES_PER_ELEMENT
    }

    writeFloat(value: float): void {
        this.view.setFloat32(this.position, value, this.littleEndian)
        this.position += Float32Array.BYTES_PER_ELEMENT
    }

    writeDouble(value: double): void {
        this.view.setFloat64(this.position, value, this.littleEndian)
        this.position += Float64Array.BYTES_PER_ELEMENT
    }

    writeBoolean(value: boolean): void {
        this.writeByte(value ? 1 : 0)
        this.position++
    }

    writeBytes(bytes: Int8Array): void {
        for (let i: int = 0; i < bytes.length; ++i) {
            this.view.setInt8(this.position, bytes[i])
        }
        this.position += bytes.length
    }

    writeNullable<T>(value: Nullable<T>, writeIfExists: (output: DataOutput, value: T) => void): void {
        if (value === null) {
            this.writeBoolean(false)
        } else {
            this.writeBoolean(true)
            writeIfExists(this, value)
        }
    }

    arrayBuffer(): ArrayBuffer {
        return this.view.buffer
    }
}

/**
 * ByteArrayOutputStream doubles its internal array-buffer when limit exceeded.
 */
export class ByteArrayOutputStream implements DataOutput {
    littleEndian: boolean = false

    #view: DataView
    #position: int = 0

    constructor(initialCapacity: int = 1024) {
        this.#view = new DataView(new ArrayBuffer(initialCapacity))
    }

    get position(): int {return this.#position}

    writeByte(value: byte): void {
        this.#ensureSpace(1)
        this.#view.setInt8(this.#position++, value)
    }

    writeShort(value: short): void {
        this.#ensureSpace(Uint16Array.BYTES_PER_ELEMENT)
        this.#view.setInt16(this.#position, value, this.littleEndian)
        this.#position += Uint16Array.BYTES_PER_ELEMENT
    }

    writeInt(value: int): void {
        this.#ensureSpace(Uint32Array.BYTES_PER_ELEMENT)
        this.#view.setInt32(this.#position, value, this.littleEndian)
        this.#position += Uint32Array.BYTES_PER_ELEMENT
    }

    writeLong(value: bigint): void {
        this.#ensureSpace(Uint32Array.BYTES_PER_ELEMENT)
        this.#view.setBigInt64(this.#position, value, this.littleEndian)
        this.#position += BigUint64Array.BYTES_PER_ELEMENT
    }

    writeFloat(value: float): void {
        this.#ensureSpace(Float32Array.BYTES_PER_ELEMENT)
        this.#view.setFloat32(this.#position, value, this.littleEndian)
        this.#position += Float32Array.BYTES_PER_ELEMENT
    }

    writeDouble(value: double): void {
        this.#ensureSpace(Float64Array.BYTES_PER_ELEMENT)
        this.#view.setFloat64(this.#position, value, this.littleEndian)
        this.#position += Float64Array.BYTES_PER_ELEMENT
    }

    writeBoolean(value: boolean): void {
        this.writeByte(value ? 1 : 0)
    }

    writeBytes(bytes: Int8Array): void {
        this.#ensureSpace(bytes.length)
        for (let i: int = 0; i < bytes.length; ++i) {
            this.#view.setInt8(this.#position++, bytes[i])
        }
    }

    writeNullable<T>(value: Nullable<T>, writeIfExists: (output: DataOutput, value: T) => void): void {
        if (value === null) {
            this.writeBoolean(false)
        } else {
            this.writeBoolean(true)
            writeIfExists(this, value)
        }
    }

    toArrayBuffer(): ArrayBuffer {return this.#view.buffer.slice(0, this.#position)}

    #ensureSpace(count: int): void {
        const capacity = this.#view.byteLength
        if (this.#position + count > capacity) {
            const o = this.#view
            this.#view = new DataView(new ArrayBuffer(capacity << 1))
            for (let i = 0; i < this.#position; i++) {
                this.#view.setInt8(i, o.getInt8(i))
            }
        }
    }
}

export class ByteCounter implements DataOutput {
    private count: int = 0 | 0
    writeByte(_: byte): void {this.count++}
    writeShort(_: short): void {this.count += 2}
    writeInt(_: int): void {this.count += 4}
    writeLong(_: bigint): void {this.count += 8}
    writeFloat(_: float): void {this.count += 4}
    writeDouble(_: double): void {this.count += 8}
    writeBoolean(_: boolean): void {this.count++}
    writeBytes(bytes: Int8Array): void {this.count += bytes.length}
    writeUTF8(value: string): void {this.count += value.length + 4}
    writeNullable<T>(value: Nullable<T>, writeIfExists: (output: DataOutput, value: T) => void): void {
        if (value === null) {
            this.writeBoolean(false)
        } else {
            this.writeBoolean(true)
            writeIfExists(this, value)
        }
    }
    get total(): int {return this.count}
}

export class ByteArrayInput implements ByteInput {
    littleEndian: boolean = false

    readonly #view: DataView

    #position: int = 0

    constructor(buffer: ArrayBuffer, byteOffset: int = 0) {this.#view = new DataView(buffer, byteOffset)}

    get position(): int {return this.#position}

    set position(value: int) {
        if (value < 0) {
            throw new Error(`New position(${value}) cannot be negative.`)
        }
        if (value > this.#view.byteLength) {
            throw new Error(`New position(${value}) is outside range (${this.#view.byteLength}).`)
        }
        this.#position = value
    }

    readByte(): byte {return this.#view.getInt8(this.#position++)}

    readShort(): short {
        const read = this.#view.getInt16(this.#position, this.littleEndian)
        this.#position += Uint16Array.BYTES_PER_ELEMENT
        return read
    }

    readInt(): int {
        const read = this.#view.getInt32(this.#position, this.littleEndian)
        this.#position += Uint32Array.BYTES_PER_ELEMENT
        return read
    }

    readLong(): bigint {
        const read = this.#view.getBigInt64(this.#position, this.littleEndian)
        this.#position += BigUint64Array.BYTES_PER_ELEMENT
        return read
    }

    readFloat(): float {
        const read = this.#view.getFloat32(this.#position, this.littleEndian)
        this.#position += Float32Array.BYTES_PER_ELEMENT
        return read
    }

    readDouble(): double {
        const read = this.#view.getFloat64(this.#position, this.littleEndian)
        this.#position += Float64Array.BYTES_PER_ELEMENT
        return read
    }

    readBoolean(): boolean {return this.readByte() === 1}

    readBytes(array: Int8Array): void {
        for (let i = 0; i < array.length; i++) {array[i] = this.readByte()}
    }

    available(count: int): boolean {return this.#position + count <= this.#view.byteLength}

    remaining(): int {return this.#view.byteLength - this.#position}

    skip(count: number): void {this.position += count}
}